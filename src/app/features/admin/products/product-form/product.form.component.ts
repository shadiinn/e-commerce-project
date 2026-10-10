import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs';

import { CATEGORIES } from '../../../../core/models/constants/categories';
import { Product, ProductVariant } from '../../../../core/models/product.model';
import { ToastService } from '../../../../core/services/toast.service';
import { isFeaturedProduct, isNewProduct } from '../../../../core/utils/product-flags';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { selectAllProducts } from '../../../../store/products/products.selectors';
import { AdminDataService } from '../../admin.service';

// To add a size in the future, update these lists. The form displays every size
// for the selected category automatically.
const CLOTHING_SIZES = ['S', 'M', 'L', 'XL'];
const TROUSER_SIZES = ['30', '32', '34', '36', '38'];
const IMAGE_OUTPUT_WIDTH = 600;
const IMAGE_OUTPUT_HEIGHT = 800;
const MIN_CROP_WIDTH = 48;

type CropMode = 'move' | 'resize';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ConfirmDialogComponent],
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

  private productId = this.route.snapshot.paramMap.get('id');
  isEditing = this.productId !== null;
  private existing: Product | null = null;

  notFound = signal(false);
  saving = signal(false);
  submitted = signal(false);
  pendingProduct = signal<Product | null>(null);
  private allProducts = toSignal(this.store.select(selectAllProducts), { initialValue: [] });

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    category: [CATEGORIES[0].slug, Validators.required],
    description: ['', [Validators.required, Validators.minLength(20)]],
    price: [0, [Validators.required, Validators.min(1)]],
    oldPrice: [0, [Validators.min(0)]],
    variants: this.fb.array([this.createVariant()], Validators.required)
  });

  // The image crop popup uses a 3:4 selection frame.
  cropImage = signal<string | null>(null);
  cropSize = signal({ width: 0, height: 0 });
  cropBox = signal({ x: 0, y: 0, width: 0, height: 0 });
  private cropSource: HTMLImageElement | null = null;
  private cropVariantIndex: number | null = null;
  private replaceImageIndex: number | null = null;
  private cropDrag: {
    mode: CropMode;
    startX: number;
    startY: number;
    box: { x: number; y: number; width: number; height: number };
  } | null = null;

  constructor() {
    this.form.controls.category.valueChanges.subscribe(() => this.updateSizesForCategory());

    if (!this.isEditing) return;

    this.store.select(selectAllProducts)
      .pipe(filter(products => products.length > 0), take(1))
      .subscribe(products => {
        const product = products.find(item => item.id === this.productId);
        if (product) this.fillForm(product);
        else this.notFound.set(true);
      });
  }

  private createVariant(variant?: ProductVariant, category: string = CATEGORIES[0].slug) {

    // Always show all sizes for this category, keeping stock for sizes already saved.
    const defaultSizes = this.sizesForCategory(category).map(size => ({
      size,
      stock: variant?.sizes.find(item => item.size === size)?.stock ?? 0
    }));

    // Keep the uncropped source beside each cropped image so it can be cropped again later.
    const originalImages = variant?.images.map((image, index) =>
      variant.originalImages?.[index] ?? image
    ) ?? [];

    return this.fb.nonNullable.group({
      id: [variant?.id ?? ''],
      color: [variant?.color ?? '', [Validators.required, Validators.minLength(2)]],
      images: this.fb.nonNullable.control<string[]>(variant?.images ?? [], Validators.required),
      originalImages: this.fb.nonNullable.control<string[]>(originalImages),
      sizes: this.fb.array(
        defaultSizes.map(size => this.createSize(size.size, size.stock)),
        Validators.required
      )
    });
  }

  private createSize(size = '', stock = 0) {
    return this.fb.nonNullable.group({
      size: [size, Validators.required],
      stock: [stock, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]]
    });
  }

  private fillForm(product: Product): void {
    this.existing = product;
    this.form.patchValue({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      oldPrice: product.oldPrice ?? 0
    });
    this.form.setControl(
      'variants',
      this.fb.array(product.variants.map(variant => this.createVariant(variant, product.category)), Validators.required)
    );
  }

  get variants() {
    return this.form.controls.variants;
  }

  availableSizes(): string[] {
    return this.sizesForCategory(this.form.controls.category.value);
  }

  private sizesForCategory(category: string): string[] {
    return category === 'trousers' ? this.trouserSizes : this.clothingSizes;
  }

  addVariant(): void {
    const variant = this.createVariant(undefined, this.form.controls.category.value);
    this.variants.push(variant);
  }

  removeVariant(index: number): void {
    if (this.variants.length > 1) this.variants.removeAt(index);
  }

  private updateSizesForCategory(): void {
    // Keep matching stock quantities, but show sizes appropriate to the chosen category.
    for (const variant of this.variants.controls) {
      const oldSizes = variant.controls.sizes.controls;
      const newSizes = this.availableSizes().map(size => {
        const old = oldSizes.find(item => item.controls.size.value === size);
        return this.createSize(size, old?.controls.stock.value ?? 0);
      });
      variant.setControl('sizes', this.fb.array(newSizes, Validators.required));
    }
  }

  oldPriceInvalid(): boolean {
    const oldPrice = this.form.controls.oldPrice.value;
    return oldPrice > 0 && oldPrice <= this.form.controls.price.value;
  }

  hasDuplicateColour(index: number): boolean {
    const current = this.variants.at(index).controls.color.value.trim().toLowerCase();
    if (!current) return false;
    return this.variants.controls.filter(item => item.controls.color.value.trim().toLowerCase() === current).length > 1;
  }

  hasDuplicateSizes(index: number): boolean {
    const sizes = this.variants.at(index).controls.sizes.controls.map(item => item.controls.size.value);
    return new Set(sizes).size !== sizes.length;
  }

  // Select a file from the computer. The image is cropped before it is added to the product.
  onImageSelected(event: Event, variantIndex: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.error('Please select a valid image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.toast.error('Please choose an image smaller than 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.openCrop(reader.result as string, variantIndex, null);
    reader.onerror = () => this.toast.error('Could not read this image. Please try another one.');
    reader.readAsDataURL(file);
  }

  // Let the admin crop an image that is already on the product, too.
  editImage(variantIndex: number, imageIndex: number): void {
    const variant = this.variants.at(variantIndex).controls;
    const originalImage = variant.originalImages.value[imageIndex];
    const image = originalImage || variant.images.value[imageIndex];
    this.openCrop(image, variantIndex, imageIndex);
  }

  removeImage(variantIndex: number, imageIndex: number): void {
    const controls = this.variants.at(variantIndex).controls;
    controls.images.setValue(controls.images.value.filter((_, index) => index !== imageIndex));
    controls.originalImages.setValue(controls.originalImages.value.filter((_, index) => index !== imageIndex));
    controls.images.markAsDirty();
    controls.images.updateValueAndValidity();
  }

  private openCrop(source: string, variantIndex: number, imageIndex: number | null): void {
    const image = new Image();

    // Existing product images may be hosted on another domain. Enable CORS
    // before setting src so the image can be exported from canvas when allowed.
    if (!source.startsWith('data:')) {
      image.crossOrigin = 'anonymous';
    }

    image.onload = () => {
      const maxWidth = Math.min(360, window.innerWidth - 80);
      const maxHeight = Math.min(420, window.innerHeight * 0.58);
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);
      const cropWidth = Math.min(width * 0.8, height * 0.8 * 0.75);
      const cropHeight = cropWidth * 4 / 3;

      this.cropSource = image;
      this.cropVariantIndex = variantIndex;
      this.replaceImageIndex = imageIndex;
      this.cropSize.set({ width, height });
      this.cropBox.set({
        x: Math.round((width - cropWidth) / 2),
        y: Math.round((height - cropHeight) / 2),
        width: cropWidth,
        height: cropHeight
      });
      this.cropImage.set(source);
    };

    image.onerror = () => {
      this.toast.error('Could not load this image. Please check the image URL and CORS settings.');
    };

    // crossOrigin must be set before src.
    image.src = source;
  }

  startCrop(event: PointerEvent): void {
    const mode = (event.target as HTMLElement).dataset['mode'] as CropMode | undefined;
    if (!mode) return;
    const area = event.currentTarget as HTMLElement;
    area.setPointerCapture(event.pointerId);
    const point = this.pointInArea(event, area);
    this.cropDrag = { mode, startX: point.x, startY: point.y, box: this.cropBox() };
  }

  moveCrop(event: PointerEvent): void {
    const drag = this.cropDrag;
    if (!drag) return;

    const point = this.pointInArea(event, event.currentTarget as HTMLElement);
    const { width, height } = this.cropSize();
    const box = drag.box;

    if (drag.mode === 'move') {
      this.cropBox.set({
        ...box,
        x: clamp(box.x + point.x - drag.startX, 0, width - box.width),
        y: clamp(box.y + point.y - drag.startY, 0, height - box.height)
      });
      return;
    }

    // Resize from the bottom-right corner while keeping the 3:4 ratio.
    const maxWidth = Math.min(width - box.x, (height - box.y) * 0.75);
    const nextWidth = clamp(box.width + point.x - drag.startX, Math.min(MIN_CROP_WIDTH, maxWidth), maxWidth);
    this.cropBox.set({ ...box, width: nextWidth, height: nextWidth * 4 / 3 });
  }

  endCrop(): void {
    this.cropDrag = null;
  }

  private pointInArea(event: PointerEvent, area: HTMLElement): { x: number; y: number } {
    const rect = area.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  saveCroppedImage(): void {
    const image = this.cropSource;
    const variantIndex = this.cropVariantIndex;

    if (!image || variantIndex === null) {
      this.toast.error('Could not crop this image. Please try again.');
      return;
    }

    const box = this.cropBox();
    const ratio = image.width / this.cropSize().width;
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_OUTPUT_WIDTH;
    canvas.height = IMAGE_OUTPUT_HEIGHT;

    const context = canvas.getContext('2d');
    if (!context) {
      this.toast.error('Could not crop this image. Please try again.');
      return;
    }

    try {
      context.drawImage(
        image,
        box.x * ratio,
        box.y * ratio,
        box.width * ratio,
        box.height * ratio,
        0,
        0,
        IMAGE_OUTPUT_WIDTH,
        IMAGE_OUTPUT_HEIGHT
      );

      // This can throw a SecurityError if the remote server does not allow CORS.
      const croppedImage = canvas.toDataURL('image/jpeg', 0.86);
      const controls = this.variants.at(variantIndex).controls;
      const images = [...controls.images.value];
      const originalImages = [...controls.originalImages.value];
      const originalImage = this.cropImage();

      if (!originalImage) {
        this.toast.error('Could not retrieve the original image.');
        return;
      }

      if (this.replaceImageIndex === null) {
        // Adding a new image.
        images.push(croppedImage);
        originalImages.push(originalImage);
      } else {
        // Replacing an existing image.
        images[this.replaceImageIndex] = croppedImage;
        originalImages[this.replaceImageIndex] = originalImage;
      }

      controls.images.setValue(images);
      controls.originalImages.setValue(originalImages);
      controls.images.markAsDirty();
      controls.images.updateValueAndValidity();

      this.closeCrop();
      this.toast.success('Image cropped successfully.');
    } catch (error) {
      console.error('Image cropping failed:', error);
      this.toast.error('Could not crop this image. Check the image server CORS settings.');
    }
  }

  closeCrop(): void {
    this.cropImage.set(null);
    this.cropSource = null;
    this.cropVariantIndex = null;
    this.replaceImageIndex = null;
    this.cropDrag = null;
  }

  save(): void {
    this.submitted.set(true);
    if (this.saving()) return;
    if (this.isEditing && !this.existing) return;

    // Mark every field so its message is visible if the form is submitted too early.
    this.form.markAllAsTouched();

    const colourNames = this.variants.controls.map(item => item.controls.color.value.trim().toLowerCase());
    const hasDuplicateColours = colourNames.some((name, index) => name && colourNames.indexOf(name) !== index);
    const hasDuplicateSize = this.variants.controls.some((_, index) => this.hasDuplicateSizes(index));

    if (this.form.invalid || this.oldPriceInvalid() || hasDuplicateColours || hasDuplicateSize) {
      this.toast.warning('Please correct the highlighted fields before saving.');
      return;
    }

    const value = this.form.getRawValue();
    const productId = this.existing?.id ?? this.nextProductId();
    const usedVariantIds = value.variants.map(variant => variant.id).filter(Boolean);

    const variants: ProductVariant[] = value.variants.map(variant => ({
      id: variant.id || this.nextVariantId(productId, usedVariantIds),
      color: variant.color.trim(),
      images: [...variant.images],
      originalImages: [...variant.originalImages],
      sizes: variant.sizes.map(size => ({ size: size.size, stock: Number(size.stock) }))
    }));

    const product: Product = {
      id: productId,
      name: value.name.trim(),
      slug: this.makeUniqueSlug(value.name, this.existing?.id),
      category: value.category,
      price: Number(value.price),
      ...(value.oldPrice > value.price ? { oldPrice: Number(value.oldPrice) } : {}),
      description: value.description.trim(),
      variants,
      rating: this.existing?.rating ?? 0,
      reviewsCount: this.existing?.reviewsCount ?? 0,
      isNew: false,
      isFeatured: false,
      createdAt: this.isEditing ? this.existing?.createdAt : new Date().toISOString()
    };

    product.isNew = isNewProduct(product);
    product.isFeatured = isFeaturedProduct(product);
    this.pendingProduct.set(product);
  }

  confirmSave(): void {
    const product = this.pendingProduct();
    if (!product || this.saving()) return;

    this.saving.set(true);
    this.data.saveProduct(product, !this.isEditing).subscribe({
      next: () => {
        this.toast.success(this.isEditing ? 'Product updated.' : 'Product added.');
        this.pendingProduct.set(null);
        this.router.navigateByUrl('/admin/products');
      },
      error: () => {
        this.toast.error('Could not save the product. Please try again.');
        this.saving.set(false);
      }
    });
  }

  cancelSave(): void {
    this.pendingProduct.set(null);
  }

  private makeUniqueSlug(name: string, currentId?: string): string {
    const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'product';
    const usedSlugs = this.allProducts()
      .filter(product => product.id !== currentId)
      .map(product => product.slug);

    let slug = base;
    let suffix = 2;
    while (usedSlugs.includes(slug)) {
      slug = `${base}-${suffix}`;
      suffix++;
    }
    return slug;
  }

  private nextProductId(): string {
    const highest = this.allProducts().reduce((max, product) => {
      const number = /^p(\d+)$/.exec(product.id);
      return number ? Math.max(max, Number(number[1])) : max;
    }, 0);
    return 'p' + String(highest + 1).padStart(3, '0');
  }

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
