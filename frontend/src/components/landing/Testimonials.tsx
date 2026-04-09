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
  const marqueeItems = [...items, ...items];

  return (
    <SectionContainer className="testimonials testimonials--enhanced">
      <div className="testimonials__header">
        <h2 className="testimonials__title">{title}</h2>
        <div className="testimonials__score">
          <span>Excellent</span>
          <div className="testimonials__score-stars" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={`score-star-${index}`} className="testimonial-rating__star">
                {'\u2605'}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="testimonials__viewport">
        <div className="testimonials__track">
          {marqueeItems.map((item, index) => (
            <Card key={`${item.name}-${index}`} as="blockquote" className="testimonial-card">
              <p className="testimonial-card__quote">"{item.quote}"</p>
              <footer className="testimonial-card__footer">
                <div className="testimonial-rating" aria-label="Rated 5 out of 5">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <span key={`${item.name}-${index}-star-${starIndex}`} className="testimonial-rating__star">
                      {'\u2605'}
                    </span>
                  ))}
                </div>
                <cite>{item.name}</cite>
              </footer>
            </Card>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
