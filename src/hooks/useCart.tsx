import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [productsData, setProductsData] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });



  const addProduct = async (productId: number) => {
    try {
      const tempCart = [...cart]
      // validar se tem estoque antes de ver se o produto está no carrinho
      const { data } = await api.get<Stock>(`stock/${productId}`);

      const thereIsProduct = cart.find(({ id }) => id === productId);

      const currentAmount = thereIsProduct ? thereIsProduct.amount : 0;

      const updatedAmount = currentAmount + 1;

      // validar o estoque
      if (updatedAmount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (thereIsProduct) {
        thereIsProduct.amount = updatedAmount
      }
      else {
        const product = await api.get<Product>(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1,
        };

        tempCart.push(newProduct);
      }

      setCart(tempCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(tempCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };




  const removeProduct = async (productId: number) => {
    try {
      const productInCart = cart.find(product => product.id === productId)

      if (!productInCart) {
        throw new Error("Erro na remoção do produto")
      }

      const updatedCart = cart.filter(x => x.id !== productId)

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      // TODO
      toast.error("Erro na remoção do produto")
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get<Stock>(`stock/${productId}`);

      if (amount <= data.amount && amount > 0) {
        var result = cart.map((x) => {
          if (x.id == productId) {
            x.amount = amount;
          }
          return x;
        });
        setCart(result);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(result));
      }
      else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
