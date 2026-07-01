/**
 * FetchKgEmpireButton
 *
 * 1. Runs the SPARQL query in the browser
 * 2. Sends results to the backend in small batches (50 rows at a time)
 *    with a 500ms delay between each batch to stay under Vercel's 4.5MB limit
 * 3. Shows live progress while storing
 */

import {
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useKeycloak } from '@react-keycloak/web';
import fetchSPARQLData from '../../helpers/fetch_query';
import { apiRequest } from '../../services/backendApi';

// Constants
const TEMPLATE_ID = 'R186491';
const FIRESTORE_DOC_ID = 'empire-full-dataset';
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 500;

//  Hardcoded SPARQL query
const KG_EMPIRE_QUERY = `
PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgc: <http://orkg.org/orkg/class/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?paper ?paperLabel ?doi ?year ?contri ?venue_name
       ?research_paradigm_label
       ?dc_label ?dc_method_name ?dc_method_type_label
       ?data_type_qualitative ?data_type_quantitative ?data_url
       ?da_label ?descriptive ?inferential ?machine_learning ?other_method
       ?desc_freq_count ?desc_freq_percent
       ?desc_central_mean ?desc_central_median ?desc_central_mode ?desc_central_min ?desc_central_max
       ?desc_disp_range ?desc_disp_variance ?desc_disp_stddev
       ?desc_pos_boxplot
       ?stat_test_label
       ?ml_algo_label ?ml_metric_recall ?ml_metric_precision ?ml_metric_accuracy ?ml_metric_fscore
       ?hypothesis_statement ?hypothesis_type_null ?hypothesis_type_alt
       ?external ?internal ?construct ?conclusion ?reliability
       ?generalizability ?repeatability ?content_validity ?descriptive_validity ?theoretical_validity ?mentioned_uncategorized
       ?question ?question_hidden ?question_highlighted ?question_type_label
       ?subquestion ?subquestion_type_label
       ?answer_hidden ?answer_highlighted
WHERE {
    ?paper orkgp:P31 ?contri .
    ?paper orkgp:P29 ?year .
    OPTIONAL { ?paper orkgp:P26 ?doi . }
    OPTIONAL { ?paper rdfs:label ?paperLabel . }
    ?contri a orkgc:C27001 .
    ?contri orkgp:P135046 ?venue .
    ?venue rdfs:label ?venue_name .
    OPTIONAL {
        ?contri orkgp:P57003 ?research_paradigm .
        ?research_paradigm rdfs:label ?research_paradigm_label .
    }
    OPTIONAL {
        ?contri orkgp:P56008 ?data_collection .
        ?data_collection rdfs:label ?dc_label .
        OPTIONAL {
            ?data_collection orkgp:P1005 ?dc_method .
            ?dc_method orkgp:P145012 ?dc_method_name .
            ?dc_method orkgp:P94003 ?dc_method_type .
            ?dc_method_type rdfs:label ?dc_method_type_label .
        }
        OPTIONAL {
            ?data_collection orkgp:DATA ?research_data .
            OPTIONAL {
                ?research_data orkgp:P7055 ?data_type .
                OPTIONAL { ?data_type orkgp:P57038 ?data_type_qualitative . }
                OPTIONAL { ?data_type orkgp:P57039 ?data_type_quantitative . }
            }
            OPTIONAL { ?research_data orkgp:url ?data_url . }
        }
    }
    OPTIONAL {
        ?contri orkgp:P15124 ?data_analysis .
        ?data_analysis rdfs:label ?da_label .
        OPTIONAL {
            ?data_analysis orkgp:P56048 ?desc_stats .
            ?desc_stats rdfs:label ?descriptive .
            OPTIONAL {
                ?desc_stats orkgp:P56049 ?desc_freq .
                OPTIONAL { ?desc_freq orkgp:P55023 ?desc_freq_count . }
                OPTIONAL { ?desc_freq orkgp:P56050 ?desc_freq_percent . }
            }
            OPTIONAL {
                ?desc_stats orkgp:P57005 ?desc_central .
                OPTIONAL { ?desc_central orkgp:P47000 ?desc_central_mean . }
                OPTIONAL { ?desc_central orkgp:P57006 ?desc_central_median . }
                OPTIONAL { ?desc_central orkgp:P57007 ?desc_central_mode . }
                OPTIONAL { ?desc_central orkgp:P44107 ?desc_central_min . }
                OPTIONAL { ?desc_central orkgp:P44108 ?desc_central_max . }
            }
            OPTIONAL {
                ?desc_stats orkgp:P57008 ?desc_disp .
                OPTIONAL { ?desc_disp orkgp:P4013 ?desc_disp_range . }
                OPTIONAL { ?desc_disp orkgp:P57009 ?desc_disp_variance . }
                OPTIONAL { ?desc_disp orkgp:P44087 ?desc_disp_stddev . }
            }
            OPTIONAL {
                ?desc_stats orkgp:P57010 ?desc_pos .
                OPTIONAL { ?desc_pos orkgp:P59065 ?desc_pos_boxplot . }
            }
        }
        OPTIONAL {
            ?data_analysis orkgp:P56043 ?inf_stats .
            ?inf_stats rdfs:label ?inferential .
            OPTIONAL {
                ?inf_stats orkgp:P35133 ?stat_test .
                ?stat_test rdfs:label ?stat_test_label .
            }
            OPTIONAL {
                ?inf_stats orkgp:P30001 ?hypothesis .
                OPTIONAL { ?hypothesis orkgp:P56046 ?hypothesis_statement . }
                OPTIONAL {
                    ?hypothesis orkgp:P41703 ?hypothesis_type .
                    OPTIONAL { ?hypothesis_type orkgp:P35106 ?hypothesis_type_null . }
                    OPTIONAL { ?hypothesis_type orkgp:P35107 ?hypothesis_type_alt . }
                }
            }
        }
        OPTIONAL {
            ?data_analysis orkgp:P57016 ?ml .
            ?ml rdfs:label ?machine_learning .
            OPTIONAL {
                ?ml orkgp:P2001 ?ml_algo .
                ?ml_algo rdfs:label ?ml_algo_label .
            }
            OPTIONAL {
                ?ml orkgp:P2006 ?ml_metrics .
                OPTIONAL { ?ml_metrics orkgp:P5073 ?ml_metric_recall . }
                OPTIONAL { ?ml_metrics orkgp:P3004 ?ml_metric_precision . }
                OPTIONAL { ?ml_metrics orkgp:P18048 ?ml_metric_accuracy . }
                OPTIONAL { ?ml_metrics orkgp:P59137 ?ml_metric_fscore . }
            }
        }
        OPTIONAL {
            ?data_analysis orkgp:P1005 ?other_method_node .
            ?other_method_node rdfs:label ?other_method .
        }
    }
    OPTIONAL {
        ?contri orkgp:P39099 ?threats .
        OPTIONAL { ?threats orkgp:P55034 ?external . }
        OPTIONAL { ?threats orkgp:P55035 ?internal . }
        OPTIONAL { ?threats orkgp:P55037 ?construct . }
        OPTIONAL { ?threats orkgp:P55036 ?conclusion . }
        OPTIONAL { ?threats orkgp:P59109 ?reliability . }
        OPTIONAL { ?threats orkgp:P60006 ?generalizability . }
        OPTIONAL { ?threats orkgp:P97002 ?repeatability . }
        OPTIONAL { ?threats orkgp:P68005 ?content_validity . }
        OPTIONAL { ?threats orkgp:P97000 ?descriptive_validity . }
        OPTIONAL { ?threats orkgp:P97001 ?theoretical_validity . }
        OPTIONAL { ?threats orkgp:P145000 ?mentioned_uncategorized . }
    }
    OPTIONAL {
        ?contri orkgp:P37330 ?rq .
        OPTIONAL { ?rq orkgp:P44139 ?question . }
        OPTIONAL { ?rq orkgp:P55038 ?question_hidden . }
        OPTIONAL { ?rq orkgp:P55039 ?question_highlighted . }
        OPTIONAL {
            ?rq orkgp:P41928 ?question_type .
            ?question_type rdfs:label ?question_type_label .
        }
        OPTIONAL {
            ?rq orkgp:P57000 ?subq .
            OPTIONAL { ?subq orkgp:P44139 ?subquestion . }
            OPTIONAL {
                ?subq orkgp:P41928 ?subquestion_type .
                ?subquestion_type rdfs:label ?subquestion_type_label .
            }
        }
    }
    OPTIONAL {
        ?contri orkgp:P57004 ?answer .
        OPTIONAL { ?answer orkgp:P55038 ?answer_hidden . }
        OPTIONAL { ?answer orkgp:P55039 ?answer_highlighted . }
    }
    FILTER (
        ?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string ||
        ?venue_name = "International Working Conference on Requirements Engineering: Foundation for Software Quality"^^xsd:string
    )
}
ORDER BY ?year ?paper
`;

//Helpers
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FetchKgEmpireButtonProps {
  disabled?: boolean;
}

const FetchKgEmpireButton = ({
  disabled = false,
}: FetchKgEmpireButtonProps) => {
  const { user } = useAuth();
  const { keycloak } = useKeycloak();

  const [fetching, setFetching] = useState(false);
  const [progress, setProgress] = useState<{
    stored: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (!user?.id || !user?.email) {
      setError('You must be logged in to run this query.');
      return;
    }

    setError(null);
    setSuccess(null);
    setProgress(null);
    setFetching(true);

    try {
      // running SPARQL query in the browser
      const rows: Record<string, string>[] =
        await fetchSPARQLData(KG_EMPIRE_QUERY);
      const total = rows.length;
      const storedAt = new Date().toISOString();

      // send metadata document
      await apiRequest(
        `/api/templates/${TEMPLATE_ID}/kg-empire-query-results/metadata`,
        {
          method: 'POST',
          body: JSON.stringify({
            id: FIRESTORE_DOC_ID,
            rowCount: total,
            storedAt,
          }),
          userId: user.id,
          userEmail: user.email,
          requiresAdmin: true,
          keycloakToken: keycloak?.token,
        }
      );

      // send rows in batches with delay
      let stored = 0;
      const batches: Record<string, string>[][] = [];
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        batches.push(rows.slice(i, i + BATCH_SIZE));
      }

      for (let i = 0; i < batches.length; i++) {
        await apiRequest(
          `/api/templates/${TEMPLATE_ID}/kg-empire-query-results/rows`,
          {
            method: 'POST',
            body: JSON.stringify({
              id: FIRESTORE_DOC_ID,
              batchIndex: i,
              rows: batches[i],
            }),
            userId: user.id,
            userEmail: user.email,
            requiresAdmin: true,
            keycloakToken: keycloak?.token,
          }
        );

        stored += batches[i].length;
        setProgress({ stored, total });

        // delay
        if (i < batches.length - 1) {
          await delay(BATCH_DELAY_MS);
        }
      }

      setSuccess(`Done — ${total} row(s) stored in Firestore.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed.');
    } finally {
      setFetching(false);
      setProgress(null);
    }
  }, [user, keycloak?.token]);

  const progressPercent = progress
    ? Math.round((progress.stored / progress.total) * 100)
    : 0;

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 1 }}>
      <Button
        variant="contained"
        startIcon={
          fetching ? (
            <CircularProgress size={16} sx={{ color: 'inherit' }} />
          ) : (
            <Search />
          )
        }
        onClick={handleClick}
        disabled={disabled || fetching}
        sx={{
          backgroundColor: '#e86161',
          '&:hover': { backgroundColor: '#d55555' },
          textTransform: 'none',
        }}
      >
        {fetching ? 'Fetching...' : 'Fetch KG-EmpiRE'}
      </Button>

      {progress && (
        <Box sx={{ mt: 1, minWidth: 260 }}>
          <Typography variant="caption" color="text.secondary">
            Storing rows {progress.stored} / {progress.total}...
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{ height: 6, borderRadius: 1, mt: 0.5 }}
          />
        </Box>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ mt: 1 }}
        >
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default FetchKgEmpireButton;
