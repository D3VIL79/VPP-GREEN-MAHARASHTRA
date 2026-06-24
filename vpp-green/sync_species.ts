import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const speciesToSeed = [
  "Amla", "Asopalav", "Babul", "Bamboo", "Bili", "Cactus", "Champa", "Coconut", 
  "Garmalo", "Gulmohor", "Gunda", "Kanchan", "Kesudo", "Khajur", "Motichanoti", 
  "Nilgiri", "Other", "Pilikaren", "Pipal", "Saptaparni", "Shirish", "Simlo", 
  "Sitafal", "Sonmahor", "Sugarcane", "Vad"
];

async function seedSpecies() {
  console.log('Fetching existing species...');
  const { data: existing, error: fetchErr } = await supabase.from('tree_species').select('species_name');
  if (fetchErr) {
    console.error('Error fetching:', fetchErr);
    return;
  }
  
  const existingNames = new Set(existing?.map(s => s.species_name.toLowerCase()) || []);
  
  const toInsert = speciesToSeed.filter(name => !existingNames.has(name.toLowerCase())).map(name => ({
    species_name: name,
    scientific_name: `${name} sp.`,
    average_co2_kg_per_year: 20.0,
    lifespan_years: 100,
    native_to_maharashtra: true
  }));
  
  if (toInsert.length > 0) {
    console.log(`Inserting ${toInsert.length} new species...`);
    const { error: insertErr } = await supabase.from('tree_species').insert(toInsert);
    if (insertErr) {
      console.error('Insert Error:', insertErr);
    } else {
      console.log('Successfully inserted all new species into the database!');
    }
  } else {
    console.log('All species are already in the database.');
  }
}

seedSpecies();
