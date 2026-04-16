const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const adminPass = await bcrypt.hash('admin123', 10);
  const chefPass  = await bcrypt.hash('chef123', 10);
  const chefPass2 = await bcrypt.hash('chef456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@forkable.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@forkable.com',
      password: adminPass,
      role: 'ADMIN',
      bio: 'Administrador da plataforma Forkable Recipes.'
    }
  });

  const chefA = await prisma.user.upsert({
    where: { email: 'maria@forkable.com' },
    update: {},
    create: {
      name: 'Maria Silva',
      email: 'maria@forkable.com',
      password: chefPass,
      role: 'CHEF',
      bio: 'Apaixonada por culinária italiana e brasileira.'
    }
  });

  const chefB = await prisma.user.upsert({
    where: { email: 'joao@forkable.com' },
    update: {},
    create: {
      name: 'João Santos',
      email: 'joao@forkable.com',
      password: chefPass2,
      role: 'CHEF',
      bio: 'Chef com foco em receitas veganas e saudáveis.'
    }
  });

  const recipe1 = await prisma.recipe.create({
    data: {
      title: 'Bolo de Chocolate Clássico',
      description: 'Um bolo de chocolate fofinho e irresistível, receita da vovó.',
      ingredients: '2 xícaras de farinha\n2 xícaras de açúcar\n3/4 xícara de cacau em pó\n2 ovos\n1 xícara de leite\n1/2 xícara de óleo\n2 colheres de chá de baunilha\n2 colheres de chá de fermento',
      instructions: '1. Preaqueça o forno a 175°C.\n2. Misture os ingredientes secos.\n3. Adicione os ingredientes úmidos e misture bem.\n4. Asse por 35-40 minutos.',
      servings: 8,
      prepTime: 50,
      category: 'Sobremesa',
      authorId: chefA.id
    }
  });

  const recipe2 = await prisma.recipe.create({
    data: {
      title: 'Bolo de Chocolate Vegano',
      description: 'Versão vegana do bolo de chocolate clássico, sem ovos e sem leite!',
      ingredients: '2 xícaras de farinha\n2 xícaras de açúcar\n3/4 xícara de cacau em pó\n2 colheres de linhaça + 6 de água (ovo de linhaça)\n1 xícara de leite de amêndoas\n1/2 xícara de óleo de coco\n2 colheres de chá de baunilha\n2 colheres de chá de fermento',
      instructions: '1. Preaqueça o forno a 175°C.\n2. Prepare o ovo de linhaça (misture e aguarde 5 min).\n3. Misture os ingredientes secos.\n4. Adicione os ingredientes úmidos e misture.\n5. Asse por 35-40 minutos.',
      servings: 8,
      prepTime: 55,
      category: 'Sobremesa',
      authorId: chefB.id,
      forkedFromId: recipe1.id
    }
  });

  await prisma.recipe.create({
    data: {
      title: 'Macarrão ao Molho Vermelho Simples',
      description: 'Um clássico molho vermelho para macarrão, prático e delicioso.',
      ingredients: '400g de macarrão espaguete\n1 lata de tomate pelado\n3 dentes de alho\n1 cebola\nAzeite, sal, pimenta e manjericão a gosto',
      instructions: '1. Cozinhe o macarrão al dente.\n2. Refogue o alho e a cebola no azeite.\n3. Adicione o tomate pelado e temperos.\n4. Cozinhe por 15 min em fogo médio.\n5. Misture com o macarrão.',
      servings: 4,
      prepTime: 25,
      category: 'Massa',
      authorId: chefA.id
    }
  });

  await prisma.user.update({
    where: { id: chefB.id },
    data: {
      favorites: { connect: { id: recipe1.id } }
    }
  });

  console.log('✅ Seed concluído!');
  console.log('');
  console.log('👤 Usuários criados:');
  console.log('  Admin  → admin@forkable.com  / admin123');
  console.log('  Chef A → maria@forkable.com  / chef123');
  console.log('  Chef B → joao@forkable.com   / chef456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());