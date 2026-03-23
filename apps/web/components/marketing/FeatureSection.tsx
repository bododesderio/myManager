interface Feature {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface FeatureSectionProps {
  heading: string;
  subheading?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
}

export function FeatureSection({ heading, subheading, features, columns = 3 }: FeatureSectionProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-16">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-bold">{heading}</h2>
        {subheading && <p className="mt-4 text-gray-600">{subheading}</p>}
      </div>
      <div className={`mt-12 grid gap-6 ${gridCols[columns]}`}>
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-brand border border-gray-200 p-6 transition hover:border-brand-primary hover:shadow-sm"
          >
            {feature.icon && (
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-brand bg-brand-primary/10 text-brand-primary">
                {feature.icon}
              </div>
            )}
            <h3 className="font-heading text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
