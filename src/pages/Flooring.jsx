import { PageHeader, Section, ItemsGrid } from '../components/ui'

export default function Flooring() {
  return (
    <>
      <PageHeader title="Flooring" subtitle="Explore our available flooring options." />
      <Section><ItemsGrid section="flooring" /></Section>
    </>
  )
}
