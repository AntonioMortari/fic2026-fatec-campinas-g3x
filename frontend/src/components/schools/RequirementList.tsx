export function RequirementList({ items }: { items: string[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0 desktop:gap-3">
      {items.map((item) => (
        <li key={item} className="grid grid-cols-[1.125rem_minmax(0,1fr)] items-start gap-2.5 text-[0.96875rem] leading-[1.5] desktop:grid-cols-[1.25rem_minmax(0,1fr)] desktop:gap-3 desktop:text-[1.0625rem]">
          <span aria-hidden="true" className="mt-[0.4375rem] size-2.5 bg-ochre desktop:mt-2" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
