import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs';

import { CATEGORIES } from '../../../../core/models/constants/categories';
import { Product, ProductVariant } from '../../../../core/models/product.model';
import { ToastService } from '../../../../core/services/toast.service';
import { selectAllProducts } from '../../../../store/products/products.selectors';
import { AdminDataService } from '../../admin.service';

// "S M L XL" and "30 32 34 36 38": buttons that add these sizes in one click
const CLOTHING_SIZES = ['S', 'M', 'L', 'XL'];
const TROUSER_SIZES = ['30', '32', '34', '36', '38'];

/*
  One form for BOTH pages:
      /admin/products/new        -> add a product   (the form starts empty)
      /admin/products/:id/edit   -> edit a product  (the form is filled with the product)

  The form has three levels:
      product (name, price ...)
        └─ variants   (one per colour)      <- a FormArray
             └─ sizes (size + stock)        <- a FormArray inside every variant
*/
@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product.form.component.html'
})
export class AdminProductFormComponent {

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private data = inject(AdminDataService);

  categories = CATEGORIES;
  clothingSizes = CLOTHING_SIZES;
  trouserSizes = TROUSER_SIZES;

  // the id in the address (/admin/products/:id/edit). No id = we are adding a product.
  private productId = this.route.snapshot.paramMap.get('id');
  isEditing = this.productId !== null;

  private existing: Product | null = null;   // the product being edited
  notFound = signal(false);
  saving = signal(false);

  private allProducts = toSignal(this.store.select(selectAllProducts), { initialValue: [] });


  // ===================================================================
  // THE FORM
  // ===================================================================

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: [''],                                        // empty = made from the name
    category: [CATEGORIES[0].slug, Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(1)]],
    oldPrice: [0, Validators.min(0)],                  // 0 = no old price
    isNew: [true],
    isFeatured: [false],
    variants: this.fb.array([this.createVariant()], Validators.minLength(1))
  });

  // a colour with its list of sizes
  private createVariant(variant?: ProductVariant) {
    return this.fb.nonNullable.group({
      id: [variant?.id ?? ''],                         // new colours get an id when saved
      color: [variant?.color ?? '', Validators.required],
      images: [variant?.images.join('\n') ?? '', Validators.required],   // one path per line
      sizes: this.fb.array(
        (variant?.sizes ?? []).map(size => this.createSize(size.size, size.stock)),
        Validators.minLength(1)
      )
    });
  }

  private createSize(size = '', stock = 0) {
    return this.fb.nonNullable.group({
      size: [size, Validators.required],
      stock: [stock, [Validators.required, Validators.min(0)]]
    });
  }

  constructor() {
    if (!this.isEditing) return;

    // Editing: wait until the products are loaded (a page refresh loads them again),
    // then fill the form with the product.
    this.store.select(selectAllProducts)
      .pipe(filter(products => products.length > 0), take(1))
      .subscribe(products => {
        const product = products.find(item => item.id === this.productId);

        if (product) {
          this.fillForm(product);
        } else {
          this.notFound.set(true);
        }
      });
  }

  private fillForm(product: Product): void {
    this.existing = product;

    this.form.patchValue({
      name: product.name,
      slug: product.slug,
      category: product.category,
      description: product.description,
      price: product.price,
      oldPrice: product.oldPrice ?? 0,
      isNew: product.isNew,
      isFeatured: product.isFeatured
    });

    // replace the empty colour with the colours of the product
    this.form.setControl(
      'variants',
      this.fb.array(product.variants.map(variant => this.createVariant(variant)), Validators.minLength(1))
    );
  }


  // ===================================================================
  // COLOURS AND SIZES (buttons of the form)
  // ===================================================================

  get variants() {
    return this.form.controls.variants;
  }

  addVariant(): void {
    this.variants.push(this.createVariant());
  }

  removeVariant(index: number): void {
    if (this.variants.length > 1) this.variants.removeAt(index);   // at least one colour stays
  }

  addSize(variantIndex: number): void {
    this.variants.at(variantIndex).controls.sizes.push(this.createSize());
  }

  removeSize(variantIndex: number, sizeIndex: number): void {
    this.variants.at(variantIndex).controls.sizes.removeAt(sizeIndex);
  }

  // adds the sizes that this colour does not have yet (with stock 0)
  addSizes(variantIndex: number, sizes: string[]): void {
    const list = this.variants.at(variantIndex).controls.sizes;
    const existing = list.controls.map(control => control.controls.size.value.trim().toLowerCase());

    for (const size of sizes) {
      if (!existing.includes(size.toLowerCase())) list.push(this.createSize(size));
    }
  }

  // the image paths typed in the textarea: one per line, empty lines removed
  imagePaths(text: string): string[] {
    return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  }


  // ===================================================================
  // SAVE
  // ===================================================================

  save(): void {
    if (this.saving()) return;

    // editing, but the product is not loaded yet
    if (this.isEditing && !this.existing) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please fill in the highlighted fields.');
      return;
    }

    const value = this.form.getRawValue();

    // the slug is the web-friendly name ("Linen Shirt" -> "linen-shirt"), and must be unique
    const slug = this.makeSlug(value.slug || value.name);
    const slugTaken = this.allProducts().some(product => product.slug === slug && product.id !== this.existing?.id);

    if (!slug || slugTaken) {
      this.form.controls.slug.setErrors({ taken: true });
      this.form.controls.slug.markAsTouched();
      this.toast.warning('This slug is already used by another product. Please change it.');
      return;
    }

    const productId = this.existing?.id ?? this.nextProductId();

    // ids already used by the colours of this product (new colours get the next free one)
    const usedVariantIds = value.variants.map(variant => variant.id).filter(id => id !== '');

    const variants: ProductVariant[] = value.variants.map(variant => {
      const id = variant.id || this.nextVariantId(productId, usedVariantIds);

      return {
        id,
        color: variant.color.trim(),
        images: this.imagePaths(variant.images),
        sizes: variant.sizes.map(size => ({ size: size.size.trim(), stock: Math.floor(size.stock) }))
      };
    });

    // the same size twice in one colour would be confusing
    const hasDuplicateSize = variants.some(variant =>
      new Set(variant.sizes.map(size => size.size.toLowerCase())).size !== variant.sizes.length
    );

    if (hasDuplicateSize) {
      this.toast.warning('A colour has the same size twice. Please remove one.');
      return;
    }

    const product: Product = {
      id: productId,
      name: value.name.trim(),
      slug,
      category: value.category,
      price: value.price,
      ...(value.oldPrice > value.price ? { oldPrice: value.oldPrice } : {}),   // only when it is higher
      description: value.description.trim(),
      variants,
      rating: this.existing?.rating ?? 0,
      reviewsCount: this.existing?.reviewsCount ?? 0,
      isNew: value.isNew,
      isFeatured: value.isFeatured,
      // a new product gets the time it is added (this puts it on top of the list);
      // an edited product keeps the date it already had
      createdAt: this.isEditing ? this.existing?.createdAt : new Date().toISOString()
    };

    this.saving.set(true);

    this.data.saveProduct(product, !this.isEditing).subscribe({
      next: () => {
        this.toast.success(this.isEditing ? 'Product updated.' : 'Product added.');
        this.router.navigateByUrl('/admin/products');
      },
      error: () => {
        this.toast.error('Could not save the product. Please try again.');
        this.saving.set(false);
      }
    });
  }

  // "Linen Shirt (Blue)" -> "linen-shirt-blue"
  private makeSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ids look like p001, p002 ... so the next one is the highest number + 1
  private nextProductId(): string {
    const highest = this.allProducts().reduce((max, product) => {
      const number = /^p(\d+)$/.exec(product.id);
      return number ? Math.max(max, Number(number[1])) : max;
    }, 0);

    return 'p' + String(highest + 1).padStart(3, '0');
  }

  // colour ids look like p001-01, p001-02 ... the first one that is not used yet
  private nextVariantId(productId: string, used: string[]): string {
    let number = 1;
    let id = `${productId}-01`;

    while (used.includes(id)) {
      number++;
      id = `${productId}-${String(number).padStart(2, '0')}`;
    }

    used.push(id);
    return id;
  }
}