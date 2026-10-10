import { createReducer, on } from '@ngrx/store';
import { loadProducts,loadProductsSuccess,loadProductsFailure } from './products.actions';

import {
  initialProductsState,
  productsAdapter
} from './products.state';



export const productsReducer = createReducer(

  initialProductsState,

  on(loadProducts,(state) => ({

    ...state,
    loading: true,
    error: null

  })),


  on(loadProductsSuccess,(state,action) =>

      productsAdapter.setAll(
        action.products,

        {
          ...state,
          loading: false,
          error: null
        }

      )
  ),


  on(loadProductsFailure,(state,action) => ({

      ...state,
      loading: false,
      error:action.error

    })
  )

);