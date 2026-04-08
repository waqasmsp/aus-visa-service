import starIcon from '../../assets/icon-star-neutral.svg';
import { Card } from '../primitives/Card';
import { SectionContainer } from '../primitives/SectionContainer';

type Testimonial = {
  name: string;
  quote: string;
};

type TestimonialsProps = {
  title: string;
  items: Testimonial[];
};

export function Testimonials({ title, items }: TestimonialsProps) {
  return (
    <SectionContainer className="testimonials">
      <h2>{title}</h2>
      <div className="testimonial-grid">
        {items.map((item) => (
          <Card key={item.name} as="blockquote" className="testimonial-card">
            <div className="testimonial-rating" aria-label="Rated 5 out of 5">
              {Array.from({ length: 5 }).map((_, index) => (
                <img key={`${item.name}-star-${index}`} src={starIcon} alt="" aria-hidden="true" />
              ))}
            </div>
            <p>“{item.quote}”</p>
            <cite>{item.name}</cite>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}
