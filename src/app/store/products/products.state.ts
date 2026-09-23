import { EntityState,createEntityAdapter } from '@ngrx/entity';
import { Product } from '../../core/models/product.model';

export interface ProductsState extends EntityState<Product> {
  loading: boolean;
  error: string | null;
}
export const productsAdapter =
  createEntityAdapter<Product>({
    selectId: product => product.id
  });

export const initialProductsState:ProductsState =
  productsAdapter.getInitialState({

    loading: false,
    error: null

  });