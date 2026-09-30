import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { MetricBarChart } from '@/components/dashboard/MetricBarChart';
import { ProgressDonut } from '@/components/dashboard/ProgressDonut';
import { Clock, AlertCircle, PlayCircle, PlusCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

const metrics = [
  {
    label: 'Atrasadas',
    value: 2,
    icon: AlertCircle,
    iconClass: 'bg-rose-500/10 text-rose-500',
    chartClass: 'bg-rose-500',
  },
  {
    label: 'Para Hoje',
    value: 5,
    icon: Clock,
    iconClass: 'bg-amber-500/10 text-amber-500',
    chartClass: 'bg-amber-500',
  },
  {
    label: 'Em Andamento',
    value: 3,
    icon: PlayCircle,
    iconClass: 'bg-indigo-500/10 text-indigo-500',
    chartClass: 'bg-indigo-500',
  },
  {
    label: 'Novas Demandas',
    value: 1,
    icon: PlusCircle,
    iconClass: 'bg-emerald-500/10 text-emerald-500',
    chartClass: 'bg-emerald-500',
  },
];

const tasks = [
  { id: 1, title: 'Finalizar arte Capa Devocional', entity: 'Anúncio 001', priority: 'URGENTE', type: 'danger' },
  { id: 2, title: 'Preparar Mockups', entity: 'Empresa ABC', priority: 'ALTA', type: 'warning' },
  { id: 3, title: 'Exportar PDFs', entity: 'Empresa XYZ', priority: 'NORMAL', type: 'info' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function Dashboard() {
  const reduceMotion = useReducedMotion();

  const hoverMotion = reduceMotion ? undefined : { y: -3 };
  const tapMotion = reduceMotion ? undefined : { scale: 0.985 };

  const chartData = metrics.map((metric) => ({
    label: metric.label,
    value: metric.value,
    accentClass: metric.chartClass,
  }));

  const totalSignaled = metrics.reduce((sum, metric) => sum + metric.value, 0);
  const inProgress = metrics.find((metric) => metric.label === 'Em Andamento')?.value ?? 0;

  return (
    <motion.div
      className="space-y-8"
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Visão Geral</h1>
        <p className="text-zinc-400 mt-1">O que você precisa fazer agora.</p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <motion.div
              key={metric.label}
              variants={itemVariants}
              whileHover={hoverMotion}
              whileTap={tapMotion}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="h-full transition-[border-color,box-shadow] duration-200 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/10">
                <CardContent className="p-5 flex items-center gap-4">
                  <motion.div
                    className={`p-3 rounded-lg ${metric.iconClass}`}
                    whileHover={reduceMotion ? undefined : { scale: 1.06, rotate: 2 }}
                    transition={{ duration: 0.16 }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-zinc-400">{metric.label}</p>
                    <h2 className="text-2xl font-bold text-zinc-100 tabular-nums">
                      <AnimatedNumber value={metric.value} />
                    </h2>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        variants={containerVariants}
      >
        <motion.div className="lg:col-span-2" variants={itemVariants}>
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-zinc-100">Resumo de demandas</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Comparação dos indicadores atuais do painel.
                </p>
              </div>
              <MetricBarChart data={chartData} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-zinc-100">Em andamento</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Participação no total de itens sinalizados.
                </p>
              </div>
              <ProgressDonut
                value={inProgress}
                total={totalSignaled}
                label="Demandas em andamento"
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        variants={containerVariants}
      >
        <motion.div className="lg:col-span-2 space-y-4" variants={itemVariants}>
          <h3 className="text-lg font-semibold text-zinc-100">Minha Fila (Prioridades)</h3>

          <motion.div className="space-y-3" variants={containerVariants}>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                variants={itemVariants}
                whileHover={reduceMotion ? undefined : { x: 3, y: -1 }}
                whileTap={tapMotion}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="hover:border-zinc-700 transition-[border-color,box-shadow] duration-200 hover:shadow-md hover:shadow-black/10 cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-zinc-200">{task.title}</h4>
                      <p className="text-sm text-zinc-500 mt-1">{task.entity}</p>
                    </div>
                    <Badge variant={task.type as any}>{task.priority}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div className="space-y-4" variants={itemVariants}>
          <h3 className="text-lg font-semibold text-zinc-100">Atividade Recente</h3>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800/50">
                <div className="p-4 text-sm">
                  <span className="text-zinc-300">Empresa ABC</span>
                  <p className="text-zinc-500 mt-1">PDF gerado e sincronizado.</p>
                  <span className="text-xs text-zinc-600 mt-2 block">Há 2 horas</span>
                </div>
                <div className="p-4 text-sm">
                  <span className="text-zinc-300">Capa Devocional</span>
                  <p className="text-zinc-500 mt-1">Arte finalizada.</p>
                  <span className="text-xs text-zinc-600 mt-2 block">Ontem</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
