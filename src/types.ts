export interface Photo {
  albumId: number;
  id: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

export interface Album {
  userId: number;
  id: number;
  title: string;
}

export interface UserCompany {
  name: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  company?: UserCompany;
}

export interface GalleryPageResult {
  photos: Photo[];
  totalCount: number;
  page: number;
}

export interface PhotoDetailResult {
  photo: Photo;
  album: Album;
  user: User;
  albumPhotos: Photo[];
}
