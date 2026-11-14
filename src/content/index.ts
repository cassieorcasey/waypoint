// Catatan materi per topik. Kuncinya adalah id topik di src/data/roadmap.ts.
// Menambah catatan: taruh file .md di folder ini, impor di bawah, daftarkan dengan id topiknya.
import python from './python.md?raw';
import gitGithub from './git-github.md?raw';
import sql from './sql.md?raw';
import aljabarLinear from './aljabar-linear.md?raw';
import kalkulusOptimasi from './kalkulus-optimasi.md?raw';
import probabilitasStatistik from './probabilitas-statistik.md?raw';
import numpy from './numpy.md?raw';
import pandas from './pandas.md?raw';
import dataCleaning from './data-cleaning.md?raw';
import visualisasiStorytelling from './visualisasi-storytelling.md?raw';
import supervisedLearning from './supervised-learning.md?raw';
import unsupervisedLearning from './unsupervised-learning.md?raw';
import evaluasiModel from './evaluasi-model.md?raw';
import dasarNeuralNetworks from './dasar-neural-networks.md?raw';
import computerVision from './computer-vision.md?raw';
import nlp from './nlp.md?raw';
import framework from './framework.md?raw';
import modelServing from './model-serving.md?raw';
import docker from './docker.md?raw';
import deploymentCloud from './deployment-cloud.md?raw';
import llm from './llm.md?raw';
import ragAiAgents from './rag-ai-agents.md?raw';
import trackingMonitoring from './tracking-monitoring.md?raw';
import ciCdUntukMl from './ci-cd-untuk-ml.md?raw';
import governanceSecurity from './governance-security.md?raw';
import prinsipLeadDataScientist from './prinsip-lead-data-scientist.md?raw';
import proyekCapstone from './proyek-capstone.md?raw';
import timeSeries from './time-series.md?raw';
import eksperimenKausal from './eksperimen-kausal.md?raw';
import dataEngineering from './data-engineering.md?raw';
import evaluasiLlm from './evaluasi-llm.md?raw';
import desainSistemMl from './desain-sistem-ml.md?raw';
import strategiAiBusinessCase from './strategi-ai-business-case.md?raw';
import komunikasiManajemenTim from './komunikasi-manajemen-tim.md?raw';

export const NOTES: Record<string, string> = {
  'python': python,
  'git-github': gitGithub,
  'sql': sql,
  'aljabar-linear': aljabarLinear,
  'kalkulus-optimasi': kalkulusOptimasi,
  'probabilitas-statistik': probabilitasStatistik,
  'numpy': numpy,
  'pandas': pandas,
  'data-cleaning': dataCleaning,
  'visualisasi-storytelling': visualisasiStorytelling,
  'supervised-learning': supervisedLearning,
  'unsupervised-learning': unsupervisedLearning,
  'evaluasi-model': evaluasiModel,
  'dasar-neural-networks': dasarNeuralNetworks,
  'computer-vision': computerVision,
  'nlp': nlp,
  'framework': framework,
  'model-serving': modelServing,
  'docker': docker,
  'deployment-cloud': deploymentCloud,
  'llm': llm,
  'rag-ai-agents': ragAiAgents,
  'tracking-monitoring': trackingMonitoring,
  'ci-cd-untuk-ml': ciCdUntukMl,
  'governance-security': governanceSecurity,
  'prinsip-lead-data-scientist': prinsipLeadDataScientist,
  'proyek-capstone': proyekCapstone,
  'time-series': timeSeries,
  'eksperimen-kausal': eksperimenKausal,
  'data-engineering': dataEngineering,
  'evaluasi-llm': evaluasiLlm,
  'desain-sistem-ml': desainSistemMl,
  'strategi-ai-business-case': strategiAiBusinessCase,
  'komunikasi-manajemen-tim': komunikasiManajemenTim,
};
