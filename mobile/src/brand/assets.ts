/**
 * Централизованные бренд-ресурсы (картинки в bundle).
 * Все require() — здесь, чтобы пути не разъезжались по проекту.
 */
import { ImageSourcePropType } from 'react-native';
import { ProductType } from '@obi/shared';

export const logoImage: ImageSourcePropType = require('../../assets/logo.png');
export const labelImage: ImageSourcePropType = require('../../assets/label.png');

const productImages: Record<ProductType, ImageSourcePropType> = {
  [ProductType.WATER_20L]: require('../../assets/products/water20.png'),
  [ProductType.WATER_05L]: require('../../assets/products/water05.png'),
  [ProductType.COOLER]: require('../../assets/products/cooler.png'),
  [ProductType.PUMP_MANUAL]: require('../../assets/products/pump_manual.png'),
  [ProductType.PUMP_ELECTRIC]: require('../../assets/products/pump_electric.png'),
  [ProductType.OTHER]: require('../../assets/logo.png'),
};

/**
 * Картинка товара: если у товара есть загруженное фото (photoUrl) — берём его,
 * иначе — встроенное фото по типу товара (для демо без файлового хранилища).
 */
export function productImage(type: ProductType, photoUrl?: string | null): ImageSourcePropType {
  if (photoUrl) return { uri: photoUrl };
  return productImages[type] ?? productImages[ProductType.OTHER];
}
