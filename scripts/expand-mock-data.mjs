#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd());
const mockDir = path.join(root, 'public', 'mock-data');

const benefitsTarget = 96;
const medicinesTarget = 120;

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(mockDir, file), 'utf8'));
const writeJson = (file, data) => fs.writeFileSync(path.join(mockDir, file), JSON.stringify(data, null, '\t'));

const pad = (num, size = 3) => String(num).padStart(size, '0');

const randomDate = (start, offsetDays) => {
	const date = new Date(start);
	date.setDate(date.getDate() + offsetDays);
	return date.toISOString().split('T')[0];
};

const regionNames = Array.from({ length: 12 }).map((_, idx) => `region-${idx + 1}`);

const expandBenefits = (base) => {
	if (base.length >= benefitsTarget) return base;
	const expanded = [...base];
	let counter = base.length;
	while (expanded.length < benefitsTarget) {
		const template = base[counter % base.length];
		const region = regionNames[counter % regionNames.length];
		const id = `${template.id}-${pad(counter + 1)}`;
		const validFrom = randomDate('2024-01-01', counter);
		const validTo = randomDate('2024-04-01', counter + 60);
		expanded.push({
			...template,
			id,
			title: `${template.title} · ${region.toUpperCase()}`,
			description: `${template.description} (регион ${region.toUpperCase()})`,
			regions: [region],
			validFrom,
			validTo,
			isNew: counter % 7 === 0,
			partner: template.partner ? `${template.partner} (${region.toUpperCase()})` : template.partner,
			savingsPerMonth: template.savingsPerMonth ?? (template.amount ?? 0) + counter * 5,
		});
		counter += 1;
	}
	return expanded;
};

const expandMedicines = (base) => {
	if (base.length >= medicinesTarget) return base;
	const expanded = [...base];
	let counter = base.length;
	while (expanded.length < medicinesTarget) {
		const template = base[counter % base.length];
		const id = `${template.id}-${pad(counter + 1)}`;
		const refillDate = randomDate('2024-02-01', counter % 120);
		const price = (template.monthlyPrice ?? 200) + (counter % 30) * 5;
		const discounted = template.discountedPrice ?? Math.max(price - 50, 0);
		expanded.push({
			...template,
			id,
			name: `${template.name} ${counter + 1}`,
			frequency: template.frequency,
			refillDate,
			monthlyPrice: price,
			discountedPrice: discounted,
			relatedBenefitIds: template.relatedBenefitIds ?? [],
			relatedOfferIds: template.relatedOfferIds ?? [],
		});
		counter += 1;
	}
	return expanded;
};

function main() {
	const benefits = expandBenefits(readJson('benefits.json'));
	writeJson('benefits.json', benefits);

	const medicines = expandMedicines(readJson('medicines.json'));
	writeJson('medicines.json', medicines);

	console.log(`Benefits: ${benefits.length}, Medicines: ${medicines.length}`);
}

main();
