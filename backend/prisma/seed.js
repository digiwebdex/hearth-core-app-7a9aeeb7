const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Super admin tenant
  const adminTenant = await prisma.tenant.create({
    data: { name: "TAWSS Platform", subscriptionPlan: "enterprise", subscriptionStatus: "active" },
  });
  const adminPass = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: { name: "Super Admin", email: "admin@travelagencyweb.com", password: adminPass, role: "super_admin", tenantId: adminTenant.id },
  });
  await prisma.tenant.update({ where: { id: adminTenant.id }, data: { ownerId: adminTenant.id } });

  // Demo tenant
  const demoTenant = await prisma.tenant.create({
    data: { name: "Al-Safa Travel Agency", subscriptionPlan: "pro", subscriptionStatus: "active", subscriptionExpiry: new Date("2027-01-01") },
  });
  const demoPass = await bcrypt.hash("demo123", 10);
  const demoUser = await prisma.user.create({
    data: { name: "Demo User", email: "user@demo.com", password: demoPass, role: "tenant_owner", tenantId: demoTenant.id },
  });
  await prisma.tenant.update({ where: { id: demoTenant.id }, data: { ownerId: demoUser.id } });

  // Demo clients
  const client1 = await prisma.client.create({
    data: { name: "Ahmed Rahman", phone: "+880171234567", email: "ahmed@example.com", nationality: "Bangladeshi", tenantId: demoTenant.id },
  });
  const client2 = await prisma.client.create({
    data: { name: "Fatima Begum", phone: "+880181234567", email: "fatima@example.com", nationality: "Bangladeshi", tenantId: demoTenant.id },
  });

  // Demo agent
  const agent = await prisma.agent.create({
    data: { name: "Karim Hassan", phone: "+880191234567", email: "karim@alsafa.com", tenantId: demoTenant.id },
  });

  // Demo vendor
  await prisma.vendor.create({
    data: { name: "Royal Wings Airlines", phone: "+966501234567", email: "bookings@royalwings.sa", category: "airline", status: "active", tenantId: demoTenant.id },
  });
  await prisma.vendor.create({
    data: { name: "Makkah Grand Hotel", phone: "+966521234567", email: "reservations@makkahgrand.sa", category: "hotel", status: "active", tenantId: demoTenant.id },
  });

  // Demo lead
  await prisma.lead.create({
    data: { name: "Saiful Islam", phone: "+880161234567", email: "saiful@example.com", status: "qualified", source: "website", destination: "Makkah, Saudi Arabia", travelerCount: 4, budget: 250000, tenantId: demoTenant.id },
  });

  // Demo booking
  const booking = await prisma.booking.create({
    data: { type: "package", title: "Umrah Package - March 2026", clientId: client1.id, agentId: agent.id, destination: "Makkah & Madinah", travelDateFrom: "2026-03-15", travelDateTo: "2026-03-29", travelerCount: 2, amount: 180000, cost: 140000, profit: 40000, status: "confirmed", tenantId: demoTenant.id },
  });

  // Demo invoice
  await prisma.invoice.create({
    data: { invoiceNumber: "INV-00001", bookingId: booking.id, clientId: client1.id, totalAmount: 180000, paidAmount: 90000, dueAmount: 90000, status: "partial", issuedDate: "2026-01-15", dueDate: "2026-03-01", tenantId: demoTenant.id },
  });

  console.log("✅ Seeding complete!");
  console.log("   Super Admin: admin@skyline.dev / admin123");
  console.log("   Demo User:   user@demo.com / demo123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
