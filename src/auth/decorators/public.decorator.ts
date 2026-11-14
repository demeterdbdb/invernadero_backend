import { SetMetadata } from '@nestjs/common';

// Marca un endpoint (o controlador) como público: no requiere token JWT.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
