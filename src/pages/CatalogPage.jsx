import { PageHeader, Section, ItemsGrid } from '../components/ui'

/** Countertops, Flooring and Backsplash: coloured header, category tabs, square tiles → detail page. */
export default function CatalogPage({ page, section }) {
  return (
    <>
      <PageHeader page={page} />
      <Section><ItemsGrid section={section} /></Section>
    </>
  )
}
