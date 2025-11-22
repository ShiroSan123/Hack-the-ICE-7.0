#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
	console.error('Missing SUPABASE credentials. Provide VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const readJson = (fileName) => {
	const filePath = path.resolve(rootDir, 'public', 'mock-data', fileName);
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const mapBenefits = (records) =>
	records.map((benefit) => ({
		id: benefit.id,
		title: benefit.title,
		description: benefit.description,
		type: benefit.type,
		target_groups: benefit.targetGroups,
		regions: benefit.regions,
		valid_from: benefit.validFrom ?? null,
		valid_to: benefit.validTo ?? null,
		requirements: benefit.requirements ?? [],
		documents: benefit.documents ?? [],
		steps: benefit.steps ?? [],
		partner: benefit.partner ?? null,
		savings_per_month: benefit.savingsPerMonth ?? null,
		is_new: Boolean(benefit.isNew),
	}));

const mapOffers = (records) =>
	records.map((offer) => ({
		id: offer.id,
		title: offer.title,
		description: offer.description,
		partner: offer.partner ?? null,
		discount: offer.discount ?? null,
		valid_from: offer.validFrom ?? null,
		valid_to: offer.validTo ?? null,
		target_groups: offer.targetGroups ?? [],
		regions: offer.regions ?? [],
		category: offer.category ?? null,
	}));

const mapMedicines = (records) =>
	records.map((medicine) => ({
		id: medicine.id,
		name: medicine.name,
		dosage: medicine.dosage ?? null,
		frequency: medicine.frequency ?? null,
		prescribed_by: medicine.prescribedBy ?? null,
		prescribed_date: medicine.prescribedDate ?? null,
		refill_date: medicine.refillDate ?? null,
		related_benefit_ids: medicine.relatedBenefitIds ?? [],
		related_offer_ids: medicine.relatedOfferIds ?? [],
		monthly_price: medicine.monthlyPrice ?? null,
		discounted_price: medicine.discountedPrice ?? null,
	}));

async function upsert(table, rows) {
	if (rows.length === 0) return;
	const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
	if (error) {
		throw new Error(`Failed to upsert ${table}: ${error.message}`);
	}
	console.log(`Upserted ${rows.length} rows into ${table}`);
}

async function main() {
	const benefits = readJson('benefits.json');
	const offers = readJson('offers.json');
	const medicines = readJson('medicines.json');

	await upsert('benefits', mapBenefits(benefits));
	await upsert('offers', mapOffers(offers));
	await upsert('medicines', mapMedicines(medicines));

	console.log('Seeding completed.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
