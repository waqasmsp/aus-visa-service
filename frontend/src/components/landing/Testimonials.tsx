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
    <SectionContainer className="testimonials testimonials--enhanced">
      <div className="testimonials__header">
        <h2 className="testimonials__title">{title}</h2>
        <div className="testimonials__score">
          <span>Excellent</span>
          <div className="testimonials__score-stars" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={`score-star-${index}`} className="testimonial-rating__star">
                *
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="testimonial-grid">
        {items.map((item) => (
          <Card key={item.name} as="blockquote" className="testimonial-card">
            <p className="testimonial-card__quote">"{item.quote}"</p>
            <footer className="testimonial-card__footer">
              <div className="testimonial-rating" aria-label="Rated 5 out of 5">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <span key={`${item.name}-star-${starIndex}`} className="testimonial-rating__star">
                    *
                  </span>
                ))}
              </div>
              <cite>{item.name}</cite>
            </footer>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}
