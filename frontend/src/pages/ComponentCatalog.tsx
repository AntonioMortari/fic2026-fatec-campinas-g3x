import { useState, type ReactNode } from 'react'
import { NextActivity } from '../components/home/NextActivity'
import {
  Button,
  Container,
  Card,
  ChipFilter,
  Alert,
  DateBadge,
  EmptyState,
  ListItem,
  PageHeader,
  PasswordField,
  Tabs,
  TextField,
  useToast,
} from '../components/ui'
import { CONTACTS } from '../lib/contacts'

const COLORS = [
  ['ochre', 'bg-ochre', 'ação "Apoiar", estado ativo, contagem e data'],
  ['ochre-deep', 'bg-ochre-deep', 'texto ocre sobre creme (sobretítulo)'],
  ['blue', 'bg-blue', 'anel de foco, faixa listrada'],
  ['blue-deep', 'bg-blue-deep', 'links e rótulo de categoria'],
  ['brown', 'bg-brown', 'texto e ação principal'],
  ['brown-400', 'bg-brown-400', 'texto secundário'],
  ['error', 'bg-error', 'mensagens de erro: texto, borda do campo e aviso'],
  ['error-tint', 'bg-error-tint', 'fundo do aviso de erro'],
  ['cream', 'bg-cream', 'superfície dominante'],
  ['card', 'bg-card', 'cartões e campos'],
] as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line py-8">
      <h2 className="m-0 text-h2 font-bold desktop:text-h2-desktop">{title}</h2>
      {children}
    </section>
  )
}

export function ComponentCatalog() {
  const [tab, setTab] = useState('upcoming')
  const [filter, setFilter] = useState('all')
  const [sending, setSending] = useState(false)
  const showToast = useToast()

  return (
    <Container className="pb-12">
      <PageHeader
        overline="Só em desenvolvimento"
        title="Catálogo do design system"
        lead="Cada componente base, no estado em que as telas vão usá-lo. Datas, vagas e horários são exemplos."
      />

      <Section title="Cores">
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 desktop:grid-cols-4">
          {COLORS.map(([name, background, usage]) => (
            <li key={name} className="flex flex-col gap-1">
              <span className={`h-14 border border-line ${background}`} />
              <strong className="text-small">{name}</strong>
              <span className="text-small text-brown-400">{usage}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Tipografia">
        <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">Sobretítulo · 12px</p>
        <p className="m-0 text-h1 font-bold">H1 · 32px</p>
        <p className="m-0 text-h2 font-bold">H2 de seção · 22px</p>
        <p className="m-0 text-h3 font-bold">H3 / item · 18px</p>
        <p className="m-0 text-body">Corpo · 16px. Tamanhos em rem: acompanham o A−/A/A+ do menu.</p>
        <p className="m-0 text-small text-brown-400">Secundário · 14px</p>
      </Section>

      <Section title="Botões">
        <div className="flex flex-wrap gap-3">
          <Button variant="applique">Quero me inscrever</Button>
          <Button>Conhecer nossos projetos</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="support">Apoiar</Button>
          <Button variant="secondary" size="compact" href={CONTACTS.instagram}>
            Instagram
          </Button>
          <Button
            loading={sending}
            onClick={() => {
              setSending(true)
              window.setTimeout(() => {
                setSending(false)
                showToast('Ana P. marcada como veio', { action: { label: 'Desfazer', onClick: () => undefined } })
              }, 1200)
            }}
          >
            Enviar
          </Button>
        </div>
      </Section>

      <Section title="Elevação em 3 níveis">
        <div className="grid gap-4 desktop:grid-cols-3">
          <Card className="p-4">
            <strong>Plano</strong>
            <p className="m-0 text-small text-brown-400">Listas, cartões comuns, campos.</p>
          </Card>
          <Card elevation="outline" className="p-4">
            <strong>Contorno</strong>
            <p className="m-0 text-small text-brown-400">Botão secundário, foco, seleção.</p>
          </Card>
          <Card elevation="applique" className="p-4">
            <strong>Aplique</strong>
            <p className="m-0 text-small text-brown-400">No máximo um por tela: o destaque.</p>
          </Card>
        </div>
      </Section>

      <Section title="Campos">
        <form className="flex max-w-md flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
          <TextField label="Seu WhatsApp" hint="Opcional. Com DDD." type="tel" inputMode="tel" autoComplete="tel" />
          <TextField label="E-mail" type="email" autoComplete="email" required placeholder="voce@exemplo.com" />
          <TextField label="Nome" error="Escreva o seu nome." defaultValue="" />
          <PasswordField label="Senha" autoComplete="current-password" />
        </form>
      </Section>

      <Section title="Abas e filtro">
        <Tabs
          label="Período"
          activeId={tab}
          onChange={setTab}
          tabs={[
            { id: 'upcoming', label: 'Em breve', content: <p className="m-0">Painel "Em breve".</p> },
            { id: 'past', label: 'Já aconteceu', content: <p className="m-0">Painel "Já aconteceu".</p> },
          ]}
        />
        <ChipFilter
          label="Tipo de atividade"
          selected={filter}
          onSelect={setFilter}
          options={[
            { value: 'all', label: 'Todas', count: 4 },
            { value: 'storytelling', label: 'Contação', count: 2 },
            { value: 'performance', label: 'Apresentação', count: 1 },
            { value: 'workshop', label: 'Oficina', count: 1 },
          ]}
        />
      </Section>

      <Section title="Cartão de evento e data">
        <Card elevation="applique" as="article" className="max-w-md">
          <div className="flex gap-3.5 p-4">
            <DateBadge date={new Date('2026-10-17T17:00:00Z')} highlight />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-blue-deep">Contação de história</span>
              <h3 className="m-0 text-[1.1875rem] leading-tight font-bold">Cafú e o Café</h3>
              <span className="text-small text-brown-400">14h · Sede, Vila Romero · Livre</span>
            </div>
          </div>
          <div className="px-4 pb-4">
            <Button fullWidth size="compact" className="min-h-12">
              Quero me inscrever
            </Button>
          </div>
        </Card>
        <Card as="article" className="flex max-w-md gap-3.5 p-4">
          <DateBadge date={new Date('2026-10-31T22:00:00Z')} />
          <div className="flex flex-col gap-1">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-blue-deep">Apresentação</span>
            <h3 className="m-0 text-[1.1875rem] leading-tight font-bold">Brasil Negreiro</h3>
          </div>
        </Card>
      </Section>

      <Section title="Próxima atividade (home)">
        <div className="max-w-xl">
          <NextActivity
            event={{
              id: 'exemplo',
              title: 'Cafú e o Café',
              description: null,
              category: 'Contação de história',
              startsAt: '2026-10-17T17:00:00Z',
              endsAt: null,
              location: 'Sede, Vila Romero',
              ageRange: 'Livre',
              capacity: null,
            }}
          />
        </div>
      </Section>

      <Section title="Lista navegável">
        <ul className="m-0 max-w-xl list-none p-0">
          <ListItem number="01" tone="ochre" title="Conhecer" description="Nossa história e os três setores." to="/quem-somos" />
          <ListItem number="02" tone="blue" title="Participar" description="Oficinas e vivências. Inscrição sem cadastro." to="/agenda" />
          <ListItem number="03" tone="brown" title="Ser voluntário" description="Cinco áreas, do pedagógico ao acervo." to="/voluntariado" />
          <ListItem number="04" tone="ochre" title="Apoiar" description="Livros, instrumentos, materiais e recursos." to="/doar" />
        </ul>
      </Section>

      <Section title="Erros">
        <p className="m-0 text-small text-brown-400">
          Vermelho só para erro, sempre com texto e ícone: a cor sozinha não basta. Campo, aviso do formulário, estado de falha e aviso fixo.
        </p>
        <TextField label="E-mail" defaultValue="ana@" error="Confira o e-mail: ele precisa ter um endereço completo, como nome@exemplo.com." />
        <Alert tone="error">Confira os campos destacados abaixo.</Alert>
        <EmptyState
          tone="error"
          title="Não conseguimos carregar os eventos"
          text="Tente de novo em alguns minutos."
          actions={
            <Button variant="secondary" size="compact">
              Tentar de novo
            </Button>
          }
        />
        <Button variant="secondary" onClick={() => showToast('Não foi possível mudar agora. Tente de novo.', { tone: 'error' })}>
          Mostrar aviso de erro
        </Button>
      </Section>

      <Section title="Estado vazio">
        <EmptyState
          title="Nenhuma atividade marcada por enquanto"
          text="Acompanhe as novidades por onde preferir."
          actions={
            <>
              <Button variant="secondary" size="compact" href={CONTACTS.instagram}>
                Instagram
              </Button>
              <Button variant="secondary" size="compact" href={CONTACTS.whatsapp}>
                WhatsApp
              </Button>
            </>
          }
        />
      </Section>
    </Container>
  )
}
