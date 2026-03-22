import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const generateSlug = (name, productId = '') => {
  const slug = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `product-${productId}`;
};

const run = async () => {
  const client = await MongoClient.connect(process.env.MONGO_URI);
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection(process.env.PRODUCTS_COLLECTION);

  const products = await collection.find().toArray();

  // build set of slugs already assigned
  const usedSlugs = new Set();
  for (const product of products) {
    if (product.urlName) {
      usedSlugs.add(product.urlName);
    }
  }

  let migratedCount = 0;
  let alreadyHadSlug = 0;

  for (const product of products) {
    if (product.urlName) {
      alreadyHadSlug++;
      continue;
    }

    const productId = product.productId || product._id.toString();
    let slug = generateSlug(product.name, productId);
    let suffix = 2;

    while (usedSlugs.has(slug)) {
      slug = generateSlug(product.name, productId) + '-' + suffix;
      suffix++;
    }

    usedSlugs.add(slug);

    await collection.updateOne(
      { _id: product._id },
      { $set: { urlName: slug } }
    );

    migratedCount++;
  }

  console.log(`Migrated ${migratedCount} products. ${alreadyHadSlug} already had slugs.`);

  await client.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
