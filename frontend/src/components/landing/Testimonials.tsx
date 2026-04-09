import { useEffect, useMemo, useState } from 'react';
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
  const [visibleCards, setVisibleCards] = useState(3);
  const maxIndex = Math.max(0, items.length - visibleCards);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const tabletQuery = window.matchMedia('(max-width: 1024px)');
    const syncVisibleCards = () => {
      if (mobileQuery.matches) {
        setVisibleCards(1);
        return;
      }

      if (tabletQuery.matches) {
        setVisibleCards(2);
        return;
      }

      setVisibleCards(3);
    };

    syncVisibleCards();
    mobileQuery.addEventListener('change', syncVisibleCards);
    tabletQuery.addEventListener('change', syncVisibleCards);
    return () => {
      mobileQuery.removeEventListener('change', syncVisibleCards);
      tabletQuery.removeEventListener('change', syncVisibleCards);
    };
  }, []);

  useEffect(() => {
    if (index > maxIndex) {
      setIndex(maxIndex);
    }
  }, [index, maxIndex]);

  useEffect(() => {
    if (maxIndex === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, 6000);

    return () => window.clearInterval(timer);
  }, [maxIndex]);

  const previous = () => {
    setIndex((current) => (current <= 0 ? maxIndex : current - 1));
  };

  const next = () => {
    setIndex((current) => (current >= maxIndex ? 0 : current + 1));
  };

  const trackStyle = useMemo(
    () => ({
      transform: `translateX(calc((100% / ${visibleCards}) * -${index}))`
    }),
    [index, visibleCards]
  );

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

      <div className="testimonials__carousel">
        <div className="testimonials__viewport">
          <div className="testimonials__track" style={trackStyle}>
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
        </div>

        <div className="testimonials__controls">
          <button type="button" className="testimonials__control testimonials__control--prev" onClick={previous} aria-label="Previous testimonial">
            &#8592;
          </button>
          <button type="button" className="testimonials__control testimonials__control--next" onClick={next} aria-label="Next testimonial">
            &#8594;
          </button>
        </div>
      </div>
    </SectionContainer>
  );
}
