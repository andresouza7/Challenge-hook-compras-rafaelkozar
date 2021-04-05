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

      const thereIsProduct = cart.find(({ id }) => id === productId);

      if (thereIsProduct) {
        const { data } = await api.get<Stock>(`stock/${productId}`);
        if (thereIsProduct.amount <= data.amount) {
          var result = cart.map((x) => {
            if (x.id == productId) {
              x.amount += 1;
            }
            return x;
          });

          setCart(result);
        }
        else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      }
      else {
        const product = (await api.get<Product>(`products/${productId}`)).data;
        product.amount = 1;
        setCart([...cart, product]);
        // cart.push(product);
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };




  const removeProduct = (productId: number) => {
    try {
      setCart([...cart.filter(x => x.id !== productId)]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {      
      const { data } = await api.get<Stock>(`stock/${productId}`);

      if(amount <= data.amount)
      {
        var result = cart.map((x) => {
          if (x.id == productId) {
            x.amount = amount;
          }
          return x;
        });        
        setCart(result);
        
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }
      else 
      {
        toast.error('Erro na adição do produto');
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
