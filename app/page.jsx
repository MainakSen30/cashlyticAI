import HeroSection from "@/components/hero";
import { featuresData, howItWorksData, statsData, testimonialsData } from "../data/landing";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className = "mt-40">
      <HeroSection/>
      {/*Stats section*/}
      <section className="py-20 bg-teal-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((stats, index) =>(
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-teal-700 mb-2">
                  {stats.value}
                </div>
                <div className="text-gray-700">
                  {stats.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*Features section*/}
      <section className="py-20">
      <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-teal-700">
            Your one stop finance manager.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg;grid-cols-3 gap-8">
            {featuresData.map((feature, index) => (
              <Card key={index} className="p-6">
              <CardContent className="space-y-4 pt-4">
                {feature.icon}
                <h3 className="text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="text-gray-700">{feature.description}</p>
              </CardContent>
            </Card>
            ))}
          </div>
        </div>
      </section>
      {/*How it works section*/}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-teal-700">
            How it works?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksData.map((step, index) => (
              <Card key={index} className="p-6">
              <CardContent className="space-y-4 pt-4">
                {step.icon}
                <h3 className="text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="text-gray-700">{step.description}</p>
              </CardContent>
            </Card>
            ))}
          </div>
        </div>
      </section>
      {/*Testimonials section*/}
      <section className="py-20 bg-teal-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-teal-700">
            What our users say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonialsData.map((testimonial, index) => (
              <Card key={index} className="p-6">
              <CardContent className="space-y-4 pt-4">
                <p className="text-gray-700">{testimonial.quote}</p>
                <div className="flex items-center space-x-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">
                      {testimonial.name}
                    </h3>
                    <p className="text-gray-700">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        </div>
      </section>
      {/*Ready to join section*/}
      <section className="py-20 bg-teal-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Ready to take control of your finances?
          </h2>
          <p className="text-teal-100 mb-8 max-w-2xl mx-auto">
            {" "}
            Sign up today to manage your finances smarter with cashlyticAI.
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-teal-50 text-teal-700 hover:bg-teal-100 animate-bounce"
            >
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
