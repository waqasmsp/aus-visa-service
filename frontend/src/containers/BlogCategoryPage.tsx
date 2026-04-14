import { BlogListingPage } from './BlogListingPage';

type BlogCategoryPageProps = {
  pathname: string;
};

export function BlogCategoryPage({ pathname }: BlogCategoryPageProps) {
  return <BlogListingPage pathname={pathname} />;
}
