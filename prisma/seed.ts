import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Tulga Community database...')

  // Create users
  const admin = await prisma.user.upsert({
    where: { telegram_id: '100000004' },
    update: {},
    create: {
      id: 'user-admin-001',
      telegram_id: '100000004',
      username: 'tulga_admin',
      display_name: 'Super Admin',
      role: 'SUPER_ADMIN',
      language: 'ru',
    },
  })

  const organiser = await prisma.user.upsert({
    where: { telegram_id: '100000002' },
    update: {},
    create: {
      id: 'user-org-001',
      telegram_id: '100000002',
      username: 'sara_org',
      display_name: 'Sara (Organiser)',
      role: 'ORGANISER',
      language: 'kk',
    },
  })

  const manager = await prisma.user.upsert({
    where: { telegram_id: '100000003' },
    update: {},
    create: {
      id: 'user-mgr-001',
      telegram_id: '100000003',
      username: 'damir_mgr',
      display_name: 'Damir (Manager)',
      role: 'MANAGER',
      language: 'ru',
    },
  })

  const member = await prisma.user.upsert({
    where: { telegram_id: '100000001' },
    update: {},
    create: {
      id: 'user-member-001',
      telegram_id: '100000001',
      username: 'alikhan_m',
      display_name: 'Alikhan',
      role: 'MEMBER',
      language: 'ru',
    },
  })

  const member2 = await prisma.user.upsert({
    where: { telegram_id: '100000005' },
    update: {},
    create: {
      id: 'user-member-002',
      telegram_id: '100000005',
      username: 'zarina_k',
      display_name: 'Zarina',
      role: 'MEMBER',
      language: 'kk',
    },
  })

  const member3 = await prisma.user.upsert({
    where: { telegram_id: '100000006' },
    update: {},
    create: {
      id: 'user-member-003',
      telegram_id: '100000006',
      username: 'bekzat_t',
      display_name: 'Bekzat',
      role: 'MEMBER',
      language: 'ru',
    },
  })

  console.log('✅ Users created')

  // Create transactions for member (Alikhan)
  const txsToCreate = [
    {
      user_id: member.id, actor_id: organiser.id, amount: 100,
      type: 'EARN', activity: 'Chess League', reason: '1st place in Chess League'
    },
    {
      user_id: member.id, actor_id: organiser.id, amount: 50,
      type: 'EARN', activity: 'Tulga Talks', reason: 'Speaker award'
    },
    {
      user_id: member.id, actor_id: organiser.id, amount: 75,
      type: 'EARN', activity: 'Kemenger Games', reason: 'Winner - Mind Games Round 3'
    },
    {
      user_id: member.id, actor_id: organiser.id, amount: 30,
      type: 'EARN', activity: 'Reading Club', reason: 'Attendance - Book Club Session'
    },
    {
      user_id: member.id, actor_id: organiser.id, amount: -20,
      type: 'REMOVED', activity: 'General', reason: 'Late submission penalty'
    },
    {
      user_id: member2.id, actor_id: organiser.id, amount: 80,
      type: 'EARN', activity: 'Halyq Aldynda', reason: 'Best speech award'
    },
    {
      user_id: member2.id, actor_id: organiser.id, amount: 40,
      type: 'EARN', activity: 'Kemenger Games', reason: 'Participation'
    },
    {
      user_id: member3.id, actor_id: organiser.id, amount: 60,
      type: 'EARN', activity: 'FIFA 26 League', reason: 'Runner-up'
    },
    {
      user_id: member3.id, actor_id: admin.id, amount: 25,
      type: 'ADJUSTMENT', activity: 'General', reason: 'Admin bonus'
    },
  ]

  for (const tx of txsToCreate) {
    await prisma.transaction.create({ data: tx })
  }
  console.log('✅ Transactions created')

  // Create products
  const products = [
    {
      name: 'Стакан Tulga Community',
      description: 'Фирменный стакан с логотипом Tulga — уникальный сувенир для участников.',
      price: 80,
      image_url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80',
      created_by: manager.id,
    },
    {
      name: 'Футболка Tulga',
      description: 'Фирменная футболка Tulga Community из высококачественного хлопка.',
      price: 150,
      image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
      created_by: manager.id,
    },
    {
      name: 'Книга по выбору',
      description: 'Любая книга из нашей читальни Reading Club на ваш выбор.',
      price: 120,
      image_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80',
      created_by: manager.id,
    },
    {
      name: 'Скидка на кофе ☕',
      description: '3 бесплатных кофе в нашем партнёрском кофе-баре.',
      price: 60,
      image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
      created_by: manager.id,
    },
    {
      name: 'VIP место на Tulga Talks',
      description: 'Зарезервированное VIP место на следующем Tulga Talks.',
      price: 200,
      image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80',
      created_by: manager.id,
    },
    {
      name: 'Ланч с ментором',
      description: 'Личная встреча за обедом с приглашённым ментором из Qonaqta Tulga.',
      price: 300,
      image_url: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&q=80',
      created_by: manager.id,
    },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: `prod-${p.name.slice(0, 10).replace(/\s/g, '-').toLowerCase()}` },
      update: {},
      create: { ...p },
    })
  }
  console.log('✅ Products created')

  // Create reward templates
  const templates = [
    { name: 'Посещаемость', name_kk: 'Қатысу', amount: 20, activity: 'General', type: 'EARN', created_by: admin.id },
    { name: 'Участие', name_kk: 'Қатысу белсенділігі', amount: 30, activity: 'General', type: 'EARN', created_by: admin.id },
    { name: '1-е место', name_kk: '1-орын', amount: 100, activity: null, type: 'EARN', created_by: admin.id },
    { name: '2-е место', name_kk: '2-орын', amount: 70, activity: null, type: 'EARN', created_by: admin.id },
    { name: '3-е место', name_kk: '3-орын', amount: 50, activity: null, type: 'EARN', created_by: admin.id },
    { name: 'Спикер', name_kk: 'Спикер', amount: 60, activity: 'Tulga Talks', type: 'EARN', created_by: admin.id },
    { name: 'Волонтёр', name_kk: 'Волонтер', amount: 40, activity: 'General', type: 'EARN', created_by: admin.id },
    { name: 'Победитель', name_kk: 'Жеңімпаз', amount: 100, activity: null, type: 'EARN', created_by: admin.id },
  ]

  for (const tmpl of templates) {
    await prisma.rewardTemplate.create({ data: tmpl })
  }
  console.log('✅ Templates created')

  console.log('\n🎉 Seed complete! Summary:')
  console.log(`  Users: ${await prisma.user.count()}`)
  console.log(`  Transactions: ${await prisma.transaction.count()}`)
  console.log(`  Products: ${await prisma.product.count()}`)
  console.log(`  Templates: ${await prisma.rewardTemplate.count()}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
