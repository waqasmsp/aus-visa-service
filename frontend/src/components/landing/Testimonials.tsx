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
    <section className="testimonials">
      <h2>{title}</h2>
      <div className="testimonial-grid">
        {items.map((item) => (
          <blockquote key={item.name}>
            <p>“{item.quote}”</p>
            <cite>{item.name}</cite>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
