import { PageHeader, Section, ItemsGrid } from '../components/ui'

export default function Countertops() {
  return (
    <>
      <PageHeader title="Countertops" subtitle="Explore our available slabs." />
      <Section><ItemsGrid section="countertop" /></Section>
    </>
  )
}
