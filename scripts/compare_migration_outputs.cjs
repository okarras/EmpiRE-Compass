
const fs = require('fs');
const assert = require('assert');

// Helper to check deep equality
function deepEqual(a, b, path = '') {
    if (a === b) return true;

    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
        console.error(`Mismatch at ${path}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
        return false;
    }

    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();

    if (keysA.length !== keysB.length) {
        console.error(`Key count mismatch at ${path}: ${keysA} !== ${keysB}`);
        return false;
    }

    for (let key of keysA) {
        if (!keysB.includes(key)) {
            console.error(`Missing key ${key} in second object at ${path}`);
            return false;
        }
        if (!deepEqual(a[key], b[key], path ? `${path}.${key}` : key)) {
            return false;
        }
    }

    return true;
}

// Transform Python result to match TS structure
function transformPythonResult(pyResult) {
    return {
        paperId: pyResult.paper_id,
        paperTitle: pyResult.paper_title,
        totalStatements: pyResult.total_statements,
        resourceCount: pyResult.resource_count,
        literalCount: pyResult.literal_count,
        predicateCount: pyResult.predicate_count,
        // Python stores arrays as JSON strings, TS stores as arrays
        resourceIds: JSON.parse(pyResult.resource_ids).sort(),
        literalIds: JSON.parse(pyResult.literal_ids).sort(),
        predicateIds: JSON.parse(pyResult.predicate_ids).sort()
    };
}

function transformPythonGlobalStats(pyStats) {
    return {
        totalStatements: pyStats.total_statements,
        totalResources: pyStats.total_resources,
        totalLiterals: pyStats.total_literals,
        totalPredicates: pyStats.total_predicates,
        globalDistinctResources: pyStats.global_distinct_resources,
        globalDistinctLiterals: pyStats.global_distinct_literals,
        globalDistinctPredicates: pyStats.global_distinct_predicates,
        // Python stats don't seem to include paperCount in global_stats map but TS does
        // We will check paperCount separately or inferred
    };
}

// Transform TS result (mostly normalization like sorting arrays)
function transformTsResult(tsResult) {
    return {
        ...tsResult,
        resourceIds: [...tsResult.resourceIds].sort(),
        literalIds: [...tsResult.literalIds].sort(),
        predicateIds: [...tsResult.predicateIds].sort()
    };
}

function main() {
    try {
        console.log("Reading input files...");
        const pyData = JSON.parse(fs.readFileSync('python_output.json', 'utf8'));
        const tsData = JSON.parse(fs.readFileSync('ts_output.json', 'utf8'));

        console.log(`Python records: ${pyData.results.length}`);
        console.log(`TypeScript records: ${tsData.results.length}`);

        if (pyData.results.length !== tsData.results.length) {
            console.error("FATAL: Different number of records processed!");
            process.exit(1);
        }

        console.log("Normalizing data...");

        // Sort results by paperId to ensure alignment
        const pyResults = pyData.results
            .map(transformPythonResult)
            .sort((a, b) => a.paperId.localeCompare(b.paperId));

        const tsResults = tsData.results
            .map(transformTsResult)
            .sort((a, b) => a.paperId.localeCompare(b.paperId));

        let failCount = 0;

        // Compare Per-Paper Results
        console.log("\n--- Comparing Per-Paper Results ---");
        for (let i = 0; i < pyResults.length; i++) {
            const py = pyResults[i];
            const ts = tsResults[i];

            if (py.paperId !== ts.paperId) {
                console.error(`Paper ID mismatch at index ${i}: ${py.paperId} vs ${ts.paperId}`);
                failCount++;
                continue;
            }

            if (!deepEqual(py, ts, `Paper[${py.paperId}]`)) {
                failCount++;
            }
        }

        // Compare Global Stats
        console.log("\n--- Comparing Global Stats ---");
        const pyGlobal = transformPythonGlobalStats(pyData.global_stats);
        const tsGlobal = tsData.globalStats;

        // Remove paperCount from TS global stats for comparison as Python might not have it in the same dict
        const { paperCount, ...tsGlobalRest } = tsGlobal;

        if (!deepEqual(pyGlobal, tsGlobalRest, 'GlobalStats')) {
            failCount++;
        }

        if (failCount === 0) {
            console.log("\n✅ PASSED: All outputs match exactly!");
            process.exit(0);
        } else {
            console.error(`\n❌ FAILED: Found ${failCount} mismatches.`);
            process.exit(1);
        }

    } catch (err) {
        console.error("An error occurred during comparison:", err);
        process.exit(1);
    }
}

main();
