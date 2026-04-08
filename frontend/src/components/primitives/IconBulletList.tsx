import checkIcon from '../../assets/icon-check.svg';

type IconBulletListProps = {
  items: string[];
  className?: string;
};

export function IconBulletList({ items, className = '' }: IconBulletListProps) {
  return (
    <ul className={`icon-bullet-list ${className}`.trim()}>
      {items.map((item) => (
        <li key={item}>
          <img src={checkIcon} alt="" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
