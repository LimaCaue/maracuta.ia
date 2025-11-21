-- Insert sample legislative proposals
INSERT INTO legislative_proposals (external_id, title, description, author, status, house, proposal_type) VALUES
('PL-1234/2024', 'PL que altera regras de aposentadoria para servidores públicos', 'Proposta que modifica critérios de aposentadoria incluindo cláusulas controversas sobre pensões', 'Dep. João Silva', 'em_tramitacao', 'camara', 'PL'),
('PL-5678/2024', 'PL sobre regulamentação de plataformas digitais', 'Projeto que estabelece novas regras para redes sociais e comércio eletrônico', 'Sen. Maria Santos', 'em_tramitacao', 'senado', 'PL'),
('PEC-99/2024', 'PEC que altera sistema tributário', 'Proposta de emenda constitucional com mudanças no ICMS e ISS', 'Dep. Pedro Costa', 'em_tramitacao', 'camara', 'PEC');

-- Insert risk alerts
INSERT INTO risk_alerts (proposal_id, risk_level, risk_type, title, description, affected_population, jabuti_detected, ai_analysis) 
SELECT 
  id,
  'critical',
  'direitos_trabalhistas',
  'Risco: Alteração de aposentadoria inclui "jabuti" sobre pensões',
  'A proposta contém cláusula escondida no artigo 47 que reduz pensões de viúvas em até 40%. Esta cláusula não tem relação com o tema principal da lei.',
  ARRAY['servidores_publicos', 'pensionistas', 'viuvas'],
  true,
  '{"confidence": 0.95, "hidden_clauses": ["art_47"], "impact_score": 9.2}'::jsonb
FROM legislative_proposals WHERE external_id = 'PL-1234/2024';

INSERT INTO risk_alerts (proposal_id, risk_level, risk_type, title, description, affected_population, jabuti_detected, ai_analysis)
SELECT 
  id,
  'high',
  'liberdade_expressao',
  'Risco: Regras de moderação podem censurar conteúdo político',
  'Artigo 12 permite bloqueio de conteúdo sem ordem judicial em "casos urgentes", o que pode ser usado para censura.',
  ARRAY['usuarios_internet', 'criadores_conteudo', 'jornalistas'],
  true,
  '{"confidence": 0.88, "hidden_clauses": ["art_12"], "impact_score": 7.8}'::jsonb
FROM legislative_proposals WHERE external_id = 'PL-5678/2024';

INSERT INTO risk_alerts (proposal_id, risk_level, risk_type, title, description, affected_population, jabuti_detected, ai_analysis)
SELECT 
  id,
  'medium',
  'economia',
  'Alerta: Mudança de ICMS pode aumentar preços',
  'Reforma pode resultar em aumento de impostos para classe média, especialmente em produtos essenciais.',
  ARRAY['classe_media', 'comerciantes', 'consumidores'],
  false,
  '{"confidence": 0.72, "hidden_clauses": [], "impact_score": 6.5}'::jsonb
FROM legislative_proposals WHERE external_id = 'PEC-99/2024';

-- Insert viral content
INSERT INTO viral_content (alert_id, content_type, content_url, script, views, shares)
SELECT 
  id,
  'audio',
  '/audio/alerta-pensoes.mp3',
  'ATENÇÃO! Uma nova lei está escondendo um corte de 40% nas pensões de viúvas. Enquanto falam de aposentadoria, cortam o sustento de quem mais precisa. Compartilhe para alertar!',
  15420,
  3240
FROM risk_alerts WHERE title LIKE '%aposentadoria%';

INSERT INTO viral_content (alert_id, content_type, content_url, script, views, shares)
SELECT 
  id,
  'video',
  '/video/censura-internet.mp4',
  'Cuidado! Uma lei sobre internet está permitindo censura sem juiz. Seu post pode ser removido sem você poder se defender. Defenda sua liberdade de expressão!',
  8950,
  1820
FROM risk_alerts WHERE title LIKE '%moderação%';
