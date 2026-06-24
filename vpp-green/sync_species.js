const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Init Supabase
const supabaseUrl = 'https://vbyvllrfsqjbxurgcsos.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZieXZsbHJmc3FqYnh1cmdjc29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTkwMTMsImV4cCI6MjA5NjQ5NTAxM30.H46OXHg97tI6wgtKI6Yr3JosijdzBFHHXDmAcfKEB9g';
const supabase = createClient(supabaseUrl, supabaseKey);

const speciesDir = path.join(__dirname, 'ai-backend', 'data', 'species');

async function syncSpecies() {
  console.log('Scanning dataset directory...');
  if (!fs.existsSync(speciesDir)) {
    console.error('Species directory not found:', speciesDir);
    return;
  }

  // Get all dataset folder names and capitalize them
  const folders = fs.readdirSync(speciesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      const name = dirent.name;
      // Capitalize first letter
      return name.charAt(0).toUpperCase() + name.slice(1);
    });

  // Unique dataset species
  const datasetSpecies = [...new Set(folders)];
  console.log(`Found ${datasetSpecies.length} unique species in dataset.`);

  // Get existing species from Supabase
  const { data: existingData, error } = await supabase.from('tree_species').select('species_name');
  if (error) {
    console.error('Failed to fetch existing species:', error);
    return;
  }

  const existingSpecies = existingData.map(s => s.species_name.toLowerCase());

  // Find missing species
  const toInsert = [];
  for (const ds of datasetSpecies) {
    if (!existingSpecies.includes(ds.toLowerCase())) {
      toInsert.push({
        species_name: ds,
        scientific_name: `${ds} sp.`, // Default placeholder
        average_co2_kg_per_year: 20.0, // Default average
        lifespan_years: 100,
        native_to_maharashtra: true
      });
    }
  }

  if (toInsert.length === 0) {
    console.log('All dataset species are already in the database. No action needed.');
    return;
  }

  console.log(`Inserting ${toInsert.length} missing species into Supabase...`);
  
  // Insert in batches
  const { data: inserted, error: insertError } = await supabase
    .from('tree_species')
    .insert(toInsert)
    .select();

  if (insertError) {
    console.error('Failed to insert species:', insertError);
  } else {
    console.log(`Successfully added ${inserted.length} new species to the Add Tree dropdown!`);
    console.log(inserted.map(i => i.species_name).join(', '));
  }
}

syncSpecies();
