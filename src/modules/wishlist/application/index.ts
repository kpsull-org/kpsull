// Ports
export type { WishlistRepository, PaginationOptions } from './ports/wishlist.repository.interface';

// Use Cases
export { AddToWishlistUseCase } from './use-cases/add-to-wishlist.use-case';
export type { AddToWishlistInput, AddToWishlistOutput } from './use-cases/add-to-wishlist.use-case';

export { RemoveFromWishlistUseCase } from './use-cases/remove-from-wishlist.use-case';
export type { RemoveFromWishlistInput } from './use-cases/remove-from-wishlist.use-case';

export { ListWishlistUseCase } from './use-cases/list-wishlist.use-case';
export type {
  ListWishlistInput,
  ListWishlistOutput,
  WishlistItemOutput,
} from './use-cases/list-wishlist.use-case';

export { CheckInWishlistUseCase } from './use-cases/check-in-wishlist.use-case';
export type {
  CheckInWishlistInput,
  CheckInWishlistOutput,
} from './use-cases/check-in-wishlist.use-case';
