import socialChatIcon from '../../assets/icon-social-chat.svg';
import socialLinkIcon from '../../assets/icon-social-link.svg';
import socialMailIcon from '../../assets/icon-social-mail.svg';
import { SectionContainer } from '../primitives/SectionContainer';

type FooterColumn = {
  heading: string;
  links: string[];
};

type FooterMegaProps = {
  columns: FooterColumn[];
  socialLinks: string[];
  copyright: string;
};

const socialIcons = [socialLinkIcon, socialMailIcon, socialChatIcon];

export function FooterMega({ columns, socialLinks, copyright }: FooterMegaProps) {
  return (
    <SectionContainer as="footer" className="footer-mega">
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

      <ul className="footer-social-links" aria-label="Social links">
        {socialLinks.map((label, index) => (
          <li key={label}>
            <a href="#" aria-label={label}>
              <img src={socialIcons[index % socialIcons.length]} alt="" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>

      <p>{copyright}</p>
    </SectionContainer>
  );
}
