import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Send, ChevronRight } from 'lucide-react';
import emailjs from '@emailjs/browser';
import Button from '../components/Button';
import Input from '../components/Input';
import { useUI } from '../context/UIContext';
import { validateEmail, validatePhone, validateRequired } from '../utils/helpers';
import SEO from '../components/SEO';

export default function Contact() {
  const { addToast } = useUI();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!validateRequired(form.name)) newErrors.name = 'Name is required';
    if (!validateEmail(form.email)) newErrors.email = 'Valid email is required';
    if (form.phone && !validatePhone(form.phone)) newErrors.phone = 'Valid phone number is required';
    if (!validateRequired(form.subject)) newErrors.subject = 'Subject is required';
    if (!validateRequired(form.message)) newErrors.message = 'Message is required';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setSending(true);
    try {
      await emailjs.send(
        'service_2uj48tc',
        'template_txm0kdg',
        {
          title: form.subject,
          name: form.name,
          from_name: form.name,
          from_email: form.email,
          email: form.email,
          message: `Phone: ${form.phone || 'Not provided'}\n\n${form.message}`,
        },
        'KIxperwBJSomUW96Z'
      );
      setSubmitted(true);
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Contact');
      }
      addToast('Your message has been sent. Our concierge team will respond within 24 hours.', 'success');
    } catch {
      addToast('Failed to send message. Please try again or email us directly.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pt-24 lg:pt-28 pb-20">
      <SEO
        title="Contact Us — Get in Touch"
        path="/contact"
        description="Contact BrandClothzy for orders, styling advice, or any questions. Reach our concierge team via email at concierge@brandclothzy.com or visit our store."
        keywords="contact BrandClothzy, customer support, fashion help, order enquiry, BrandClothzy email, store location"
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} />
          <span className="text-luxury-charcoal">Contact Us</span>
        </nav>

        <div className="text-center mt-8 mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Get In Touch</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-luxury-charcoal mb-4">Contact Us</h1>
          <p className="text-sm text-neutral-500 font-light max-w-lg mx-auto leading-relaxed">
            Our dedicated concierge team is here to assist you with any enquiries
            regarding our collections, orders, or services.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="text-center py-20 border border-neutral-100">
                <div className="w-16 h-16 border-2 border-luxury-gold rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send size={24} className="text-luxury-gold" />
                </div>
                <h2 className="font-serif text-2xl text-luxury-charcoal mb-3">Message Received</h2>
                <p className="text-sm text-neutral-500 font-light max-w-sm mx-auto mb-8">
                  Thank you for reaching out. Our team will respond to your enquiry within 24 hours.
                </p>
                <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} error={errors.name} required />
                  <Input label="Email Address" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="Phone Number" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} error={errors.phone} />
                  <Input label="Subject" value={form.subject} onChange={(e) => update('subject', e.target.value)} error={errors.subject} required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-2">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    rows={6}
                    className={`w-full px-4 py-3 text-sm font-light border ${errors.message ? 'border-red-400' : 'border-neutral-200'} outline-none focus:border-luxury-charcoal transition-colors resize-none`}
                  />
                  {errors.message && <p className="text-[11px] text-red-400 mt-1">{errors.message}</p>}
                </div>
                <Button type="submit" size="lg" loading={sending}>Send Message</Button>
              </form>
            )}
          </div>

          <div className="space-y-8">
            {[
              {
                icon: MapPin,
                title: 'Registered Address',
                lines: [
                  'Burptech Private Limited',
                  'B-7, Aryan Bungalows, Chankyapuri Rd,',
                  'S G Road, Ghatloadia,',
                  'Ahmedabad City, Ahmedabad - 380061,',
                  'Gujarat',
                ],
              },
              {
                icon: MapPin,
                title: 'Operational Address',
                lines: [
                  'B-7 Aryan Bungalows',
                  'Chankyapuri Road',
                  'Nr Harivilla Flat',
                  'Opp. Kargil Petrol Pump',
                  'Ahmedabad, Gujarat 380060',
                ],
              },
              { icon: Phone, title: 'Call Us', lines: ['+91 77788 67131', 'Mon – Sat, 10AM – 7PM IST'] },
              { icon: Mail, title: 'Email', lines: ['concierge@brandclothzy.com', 'press@brandclothzy.com'] },
              { icon: Clock, title: 'Working Hours', lines: ['Monday – Saturday: 10AM – 7PM', 'Sunday: 11AM – 5PM'] },
            ].map(({ icon: Icon, title, lines }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 flex items-center justify-center border border-neutral-200 flex-shrink-0">
                  <Icon size={16} className="text-luxury-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-luxury-charcoal mb-1">{title}</h3>
                  {lines.map((line) => (
                    <p key={line} className="text-sm text-neutral-500 font-light">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
