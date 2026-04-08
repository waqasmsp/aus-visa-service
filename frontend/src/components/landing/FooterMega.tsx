type FooterColumn = {
  heading: string;
  links: string[];
};

type FooterMegaProps = {
  columns: FooterColumn[];
  copyright: string;
};

export function FooterMega({ columns, copyright }: FooterMegaProps) {
  return (
    <footer className="footer-mega">
      <div className="footer-columns">
        {columns.map((column) => (
          <div key={column.heading}>
            <h3>{column.heading}</h3>
            <ul>
              {column.links.map((link) => (
                <li key={link}><a href="#">{link}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p>{copyright}</p>
    </footer>
  );
}
