import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Users, UserCheck, UserCog, Store, Target, ListTodo, FileText, Plane,
  Receipt, Wallet, BarChart3, Bell, Moon, Building2, Globe, Crown, Settings, Shield, UserCog2, BookOpen
} from "lucide-react";

type Section = {
  id: string;
  title: string;
  icon: any;
  intro: string;
  steps: string[];
  tips?: string[];
};

const sections: Section[] = [
  {
    id: "getting-started",
    title: "শুরু করা (Getting Started)",
    icon: BookOpen,
    intro: "এই গাইডটি আপনার ট্রাভেল এজেন্সি অ্যাকাউন্ট ব্যবহারের সম্পূর্ণ নির্দেশিকা। প্রতিটি মডিউলের কাজ ও ব্যবহার নিচে বিস্তারিতভাবে দেওয়া হয়েছে।",
    steps: [
      "সাবডোমেইনে লগইন করুন (যেমন: yourname.travelagencyweb.com অথবা app.travelagencyweb.com)।",
      "প্রথমবার লগইনের পর Onboarding ধাপগুলো সম্পন্ন করুন: কোম্পানির নাম, লোগো, ঠিকানা এবং কারেন্সি সেট করুন।",
      "Team মডিউল থেকে আপনার স্টাফদের যোগ করুন এবং প্রত্যেকের রোল (Role) নির্ধারণ করুন।",
      "Settings থেকে SMTP, SMS, পেমেন্ট গেটওয়ে কনফিগার করুন।",
    ],
    tips: ["সবার আগে Organization তথ্য সম্পূর্ণ করুন — এটি ইনভয়েস ও কোটেশনে ব্যবহার হবে।"],
  },
  {
    id: "dashboard",
    title: "Dashboard (ড্যাশবোর্ড)",
    icon: LayoutDashboard,
    intro: "ড্যাশবোর্ডে আপনার ব্যবসার সারসংক্ষেপ এক নজরে দেখা যাবে।",
    steps: [
      "মোট লিড, বুকিং, ইনভয়েস ও আয়/ব্যয় গ্রাফ আকারে দেখা যাবে।",
      "সাম্প্রতিক কার্যকলাপ ও আপকামিং টাস্ক ট্র্যাক করুন।",
      "প্রতিটি কার্ডে ক্লিক করে সংশ্লিষ্ট মডিউলে যেতে পারবেন।",
    ],
  },
  {
    id: "clients",
    title: "Clients (ক্লায়েন্ট)",
    icon: UserCheck,
    intro: "আপনার সকল ক্লায়েন্টের তথ্য সংরক্ষণ ও ব্যবস্থাপনা করুন।",
    steps: [
      "Clients পেজে গিয়ে \"Add Client\" বাটনে ক্লিক করুন।",
      "নাম, ফোন, ইমেইল, পাসপোর্ট নম্বর, ঠিকানা ইত্যাদি পূরণ করুন।",
      "Save করলে ক্লায়েন্ট লিস্টে যুক্ত হবে।",
      "যেকোনো ক্লায়েন্টের নামে ক্লিক করে তার সম্পূর্ণ প্রোফাইল, বুকিং ও পেমেন্ট হিস্টরি দেখুন।",
      "Edit/Delete আইকন দিয়ে তথ্য আপডেট বা মুছে ফেলতে পারবেন।",
    ],
    tips: ["Search বার ব্যবহার করে দ্রুত ক্লায়েন্ট খুঁজে পান।", "Export বাটন দিয়ে সব ক্লায়েন্ট CSV/Excel এ ডাউনলোড করুন।"],
  },
  {
    id: "agents",
    title: "Agents (এজেন্ট)",
    icon: UserCog,
    intro: "সাব-এজেন্ট বা কমিশনভিত্তিক বিক্রয়কর্মীদের ব্যবস্থাপনা করুন।",
    steps: [
      "Agents পেজ থেকে নতুন এজেন্ট যোগ করুন।",
      "প্রতিটি এজেন্টের কমিশন রেট সেট করুন।",
      "এজেন্টের আনা বুকিং ও কমিশন রিপোর্ট দেখুন।",
    ],
  },
  {
    id: "vendors",
    title: "Vendors (ভেন্ডর/সাপ্লায়ার)",
    icon: Store,
    intro: "এয়ারলাইন্স, হোটেল, ট্রান্সপোর্ট কোম্পানি ইত্যাদি সাপ্লায়ারের তথ্য রাখুন।",
    steps: [
      "Add Vendor দিয়ে ভেন্ডরের তথ্য যোগ করুন।",
      "ভেন্ডরের সাথে আপনার দেনা-পাওনা (Payable) ট্র্যাক করুন।",
      "Vendor Details পেজ থেকে সমস্ত পারচেজ ও পেমেন্ট হিস্টরি দেখুন।",
    ],
  },
  {
    id: "leads",
    title: "Leads (লিড ম্যানেজমেন্ট)",
    icon: Target,
    intro: "সম্ভাব্য কাস্টমারদের ইনকোয়ারি ক্যাপচার ও ফলোআপ করুন।",
    steps: [
      "Add Lead থেকে নতুন ইনকোয়ারি যোগ করুন (নাম, ফোন, ডেস্টিনেশন, বাজেট)।",
      "লিড স্ট্যাটাস আপডেট করুন: New → Contacted → Qualified → Converted/Lost।",
      "প্রতিটি লিডে নোট ও ফলোআপ ডেট সেট করুন।",
      "লিড থেকে সরাসরি কোটেশন তৈরি করতে পারবেন।",
    ],
    tips: ["প্রতিদিন Pending Follow-up লিডগুলো চেক করুন।"],
  },
  {
    id: "tasks",
    title: "Tasks (টাস্ক)",
    icon: ListTodo,
    intro: "টিমের জন্য কাজ অ্যাসাইন ও ট্র্যাক করুন।",
    steps: [
      "Add Task দিয়ে নতুন কাজ তৈরি করুন।",
      "ডেডলাইন, প্রায়োরিটি এবং অ্যাসাইনি (টিম মেম্বার) সেট করুন।",
      "কাজ সম্পন্ন হলে স্ট্যাটাস Completed করুন।",
    ],
  },
  {
    id: "quotations",
    title: "Quotations (কোটেশন)",
    icon: FileText,
    intro: "ক্লায়েন্টকে প্রফেশনাল কোটেশন/প্রপোজাল পাঠান।",
    steps: [
      "Quotations → New Quotation এ যান।",
      "ক্লায়েন্ট সিলেক্ট করুন এবং সার্ভিস আইটেম যোগ করুন (ফ্লাইট, হোটেল, ভিসা ইত্যাদি)।",
      "মূল্য, ট্যাক্স ও ডিসকাউন্ট সেট করুন।",
      "Save করার পর Print/PDF ডাউনলোড করুন বা ইমেইলে পাঠান।",
      "ক্লায়েন্ট এক্সেপ্ট করলে এক ক্লিকে Booking এ কনভার্ট করুন।",
    ],
  },
  {
    id: "bookings",
    title: "Bookings (বুকিং)",
    icon: Plane,
    intro: "কনফার্মড বুকিংসমূহ ব্যবস্থাপনা করুন।",
    steps: [
      "Add Booking থেকে নতুন বুকিং তৈরি করুন (অথবা কোটেশন থেকে অটো-জেনারেট)।",
      "PNR, ট্রাভেল ডেট, প্যাসেঞ্জার তথ্য, ভেন্ডর কস্ট পূরণ করুন।",
      "বুকিং ডিটেইলস পেজে গিয়ে পেমেন্ট, ইনভয়েস ও ডকুমেন্ট সংযুক্ত করুন।",
      "স্ট্যাটাস: Pending / Confirmed / Cancelled আপডেট রাখুন।",
    ],
  },
  {
    id: "invoices",
    title: "Invoices (ইনভয়েস)",
    icon: Receipt,
    intro: "ক্লায়েন্টের জন্য ইনভয়েস তৈরি ও পেমেন্ট রিসিপ্ট ইস্যু করুন।",
    steps: [
      "বুকিং থেকে স্বয়ংক্রিয়ভাবে ইনভয়েস তৈরি হয়, অথবা ম্যানুয়ালি যোগ করুন।",
      "Print, Download PDF, বা ইমেইলে পাঠান।",
      "পেমেন্ট রিসিভ হলে \"Add Payment\" দিয়ে রেকর্ড করুন।",
      "Receipt পেজ থেকে রিসিপ্ট প্রিন্ট করুন।",
    ],
  },
  {
    id: "accounts",
    title: "Accounts (অ্যাকাউন্টস)",
    icon: Wallet,
    intro: "ক্যাশ, ব্যাংক, প্রাপ্য, প্রদেয় ও খরচ — সম্পূর্ণ হিসাব ব্যবস্থা।",
    steps: [
      "Cash & Bank Accounts ট্যাব থেকে আপনার ব্যাংক/ক্যাশ অ্যাকাউন্ট যোগ করুন।",
      "Payments Received: ক্লায়েন্ট পেমেন্ট ট্র্যাক করুন।",
      "Vendor Payables: ভেন্ডরকে যা দেনা আছে তা দেখুন ও পরিশোধ করুন।",
      "Expenses ট্যাবে অফিস খরচ যোগ করুন।",
      "Ledger ট্যাবে সব লেনদেনের ইতিহাস দেখুন।",
      "Profitability ট্যাবে লাভ-ক্ষতির হিসাব পাবেন।",
    ],
  },
  {
    id: "reports",
    title: "Reports (রিপোর্টস)",
    icon: BarChart3,
    intro: "ব্যবসার বিস্তারিত বিশ্লেষণাত্মক রিপোর্ট দেখুন।",
    steps: [
      "Sales Report: বিক্রয়ের বিবরণ।",
      "Payment Report: পেমেন্ট কালেকশন।",
      "Profitability Report: লাভ-ক্ষতি।",
      "Vendor Report: ভেন্ডরভিত্তিক খরচ।",
      "Staff Performance: প্রতিটি স্টাফের পারফরম্যান্স।",
      "Leads & Quotation Report: কনভার্শন রেট।",
      "তারিখ ফিল্টার দিয়ে কাস্টম পিরিয়ডের রিপোর্ট নিন এবং Export করুন।",
    ],
  },
  {
    id: "notifications",
    title: "Notifications (নোটিফিকেশন)",
    icon: Bell,
    intro: "সিস্টেম থেকে পাঠানো সকল ইমেইল/SMS নোটিফিকেশনের লগ।",
    steps: [
      "প্রতিটি নোটিফিকেশনের ডেলিভারি স্ট্যাটাস দেখুন।",
      "ব্যর্থ হলে কারণ চেক করুন এবং পুনরায় পাঠান।",
    ],
  },
  {
    id: "hajj",
    title: "Hajj/Umrah (হজ্জ ও উমরাহ)",
    icon: Moon,
    intro: "হজ্জ ও উমরাহ প্যাকেজ এবং পিলগ্রিম ব্যবস্থাপনা।",
    steps: [
      "প্যাকেজ তৈরি করুন (মুয়াল্লিম, হোটেল, ফ্লাইট, ট্রান্সপোর্ট সহ)।",
      "প্রতিটি পিলগ্রিমের পাসপোর্ট, ভিসা, মাহরাম তথ্য রাখুন।",
      "গ্রুপ ভিত্তিক বুকিং ব্যবস্থাপনা করুন।",
    ],
  },
  {
    id: "team",
    title: "Team & Roles (টিম ও রোল)",
    icon: Users,
    intro: "স্টাফ যোগ করুন ও তাদের অ্যাক্সেস লেভেল নির্ধারণ করুন।",
    steps: [
      "Team পেজে Invite Member দিয়ে নতুন স্টাফ যোগ করুন।",
      "ইমেইলে ইনভাইটেশন যাবে — তারা পাসওয়ার্ড সেট করবে।",
      "Roles পেজে কাস্টম রোল তৈরি করুন (যেমন: Sales, Accountant, Manager)।",
      "প্রতিটি রোলের জন্য মডিউল ভিত্তিক View/Create/Edit/Delete পারমিশন সেট করুন।",
    ],
    tips: ["Owner রোল সব কিছু এক্সেস করতে পারে — সাবধানে অ্যাসাইন করুন।"],
  },
  {
    id: "organization",
    title: "Organization (কোম্পানি প্রোফাইল)",
    icon: Building2,
    intro: "আপনার কোম্পানির তথ্য — যা ইনভয়েস, কোটেশন ও ওয়েবসাইটে দেখাবে।",
    steps: [
      "কোম্পানির নাম, লোগো, ঠিকানা, ফোন, ইমেইল, ওয়েবসাইট পূরণ করুন।",
      "ট্রেড লাইসেন্স / TIN নম্বর যোগ করুন।",
      "ডিফল্ট কারেন্সি ও ট্যাক্স রেট সেট করুন।",
    ],
  },
  {
    id: "website",
    title: "Website Customizer (ওয়েবসাইট)",
    icon: Globe,
    intro: "নিজের সাবডোমেইনে একটি প্রফেশনাল ট্রাভেল এজেন্সি ওয়েবসাইট চালু করুন।",
    steps: [
      "টেমপ্লেট সিলেক্ট করুন (Travel Agency / Tour Packages / Hajj-Umrah)।",
      "হিরো সেকশন, রঙ, লোগো, কন্টেন্ট কাস্টমাইজ করুন।",
      "প্যাকেজ যোগ করুন যা ওয়েবসাইটে দেখাবে।",
      "কাস্টম ডোমেইন কানেক্ট করতে Admin → Domains এ যান।",
    ],
  },
  {
    id: "subscription",
    title: "Subscription (সাবস্ক্রিপশন)",
    icon: Crown,
    intro: "আপনার সাবস্ক্রিপশন প্ল্যান, বিলিং ও আপগ্রেড।",
    steps: [
      "বর্তমান প্ল্যান এবং মেয়াদ দেখুন।",
      "Upgrade বাটনে ক্লিক করে উচ্চতর প্ল্যানে যান (Basic / Pro / Business / Enterprise)।",
      "পেমেন্ট মেথড সিলেক্ট করুন (bKash / SSLCommerz / Card)।",
      "পেমেন্ট হিস্টরি ও ইনভয়েস ডাউনলোড করুন।",
    ],
  },
  {
    id: "settings",
    title: "Settings (সেটিংস)",
    icon: Settings,
    intro: "আপনার অ্যাকাউন্ট ও কনফিগারেশন।",
    steps: [
      "Profile: নিজের নাম ও পাসওয়ার্ড আপডেট করুন।",
      "SMTP Settings: নিজের ইমেইল সার্ভার দিয়ে ক্লায়েন্টকে ইমেইল পাঠান।",
      "Data Export: সম্পূর্ণ ডেটা ব্যাকআপ ডাউনলোড করুন।",
    ],
  },
];

const UserGuide = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">ব্যবহার নির্দেশিকা (User Guide)</h1>
            </div>
            <p className="text-muted-foreground">
              আপনার ট্রাভেল এজেন্সি সফটওয়্যার ব্যবহারের সম্পূর্ণ গাইড — বাংলায়।
            </p>
          </div>
          <Badge variant="secondary" className="hidden md:inline-flex">বাংলা গাইড</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">দ্রুত নেভিগেশন</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <s.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{s.title}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        <Accordion type="multiple" defaultValue={["getting-started"]} className="space-y-3">
          {sections.map((s) => (
            <AccordionItem key={s.id} value={s.id} id={s.id} className="border rounded-lg bg-card scroll-mt-24">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold">{s.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-muted-foreground mb-3">{s.intro}</p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2 text-sm uppercase tracking-wide text-muted-foreground">ধাপসমূহ</h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-sm leading-relaxed">
                      {s.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  {s.tips && s.tips.length > 0 && (
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                      <h4 className="font-medium mb-1.5 text-sm">💡 টিপস</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {s.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">সহায়তা প্রয়োজন?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>কোনো সমস্যায় পড়লে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>ইমেইল: support@travelagencyweb.com</li>
              <li>ওয়েবসাইট: travelagencyweb.com/contact-us</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserGuide;
