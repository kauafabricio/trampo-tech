import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  arrowForwardOutline,
  checkmarkOutline,
  compassOutline
} from 'ionicons/icons';
import { DiagnosticoService, RespostasDiagnostico } from '../../services/diagnostico';
import { AuthService } from '../../services/auth';

interface OpcaoDiagnostico {
  valor: string;
  texto: string;
}

interface QuestaoDiagnostico {
  id: keyof RespostasDiagnostico;
  secao: string;
  pergunta: string;
  opcoes?: OpcaoDiagnostico[];
}

const opcoes = (textos: string[]): OpcaoDiagnostico[] =>
  textos.map((texto) => ({ valor: texto, texto }));

const secoes = {
  contexto: 'Informações gerais',
  planejamento: 'Planejamento de projetos',
  execucao: 'Execução e acompanhamento',
  processos: 'Processos e ferramentas',
  abertas: 'Para completar seu diagnóstico'
};

@Component({
  selector: 'app-diagnostico-inicial',
  templateUrl: './diagnostico-inicial.page.html',
  styleUrls: ['./diagnostico-inicial.page.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, IonContent, IonIcon]
})
export class DiagnosticoInicialPage {
  readonly totalQuestoes = 15;
  indiceAtual = 0;
  salvando = false;
  private readonly fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    estagio: ['', Validators.required],
    tamanhoEquipe: ['', Validators.required],
    organizacaoProjetos: ['', Validators.required],
    objetivos: ['', Validators.required],
    distribuicaoTarefas: ['', Validators.required],
    prazos: ['', Validators.required],
    riscos: ['', Validators.required],
    acompanhamento: ['', Validators.required],
    prioridades: ['', Validators.required],
    registroDecisoes: ['', Validators.required],
    identificacaoAtrasos: ['', Validators.required],
    processos: ['', Validators.required],
    revisaoResultados: ['', Validators.required],
    resultadoDesejado: ['', [Validators.required, Validators.maxLength(1000)]],
    problemaRecorrente: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  readonly questoes: QuestaoDiagnostico[] = [
    {
      id: 'estagio',
      secao: secoes.contexto,
      pergunta: 'Qual é o estágio atual da sua startup?',
      opcoes: opcoes([
        'Ideação — estamos desenvolvendo a ideia.',
        'Validação — estamos testando a solução.',
        'MVP — temos uma versão inicial do produto.',
        'Operação — já temos clientes.',
        'Crescimento — estamos expandindo o negócio.'
      ])
    },
    {
      id: 'tamanhoEquipe',
      secao: secoes.contexto,
      pergunta: 'Quantas pessoas fazem parte da equipe?',
      opcoes: opcoes(['1 pessoa.', '2 a 5 pessoas.', '6 a 10 pessoas.', '11 a 20 pessoas.', 'Mais de 20 pessoas.'])
    },
    {
      id: 'organizacaoProjetos',
      secao: secoes.contexto,
      pergunta: 'Como os projetos são organizados atualmente?',
      opcoes: opcoes([
        'Não temos um método definido.',
        'Organizamos as atividades informalmente.',
        'Utilizamos planilhas ou listas de tarefas.',
        'Utilizamos ferramentas de gestão de projetos.',
        'Seguimos uma metodologia estruturada.'
      ])
    },
    {
      id: 'objetivos',
      secao: secoes.planejamento,
      pergunta: 'Como os objetivos dos projetos são definidos?',
      opcoes: opcoes([
        'Não são definidos claramente.',
        'São definidos informalmente pela equipe.',
        'São registrados, mas não possuem indicadores.',
        'São documentados com metas, prazos e indicadores.'
      ])
    },
    {
      id: 'distribuicaoTarefas',
      secao: secoes.planejamento,
      pergunta: 'Como as tarefas são distribuídas entre os integrantes?',
      opcoes: opcoes([
        'Não existe uma divisão clara.',
        'As tarefas são distribuídas conforme surgem.',
        'Cada integrante possui responsabilidades definidas.',
        'Utilizamos planejamento e acompanhamento das responsabilidades.'
      ])
    },
    {
      id: 'prazos',
      secao: secoes.planejamento,
      pergunta: 'Como os prazos dos projetos são estabelecidos?',
      opcoes: opcoes([
        'Não estabelecemos prazos.',
        'Definimos prazos sem estimativas estruturadas.',
        'Estimamos prazos considerando as tarefas e os recursos.',
        'Monitoramos os prazos e ajustamos o planejamento quando necessário.'
      ])
    },
    {
      id: 'riscos',
      secao: secoes.planejamento,
      pergunta: 'Como a equipe identifica os riscos de um projeto?',
      opcoes: opcoes([
        'Não identificamos riscos antecipadamente.',
        'Identificamos riscos quando os problemas aparecem.',
        'Discutimos os riscos durante o planejamento.',
        'Registramos, priorizamos e acompanhamos os riscos.'
      ])
    },
    {
      id: 'acompanhamento',
      secao: secoes.execucao,
      pergunta: 'Como a equipe acompanha o andamento dos projetos?',
      opcoes: opcoes([
        'Não realiza acompanhamento regular.',
        'Acompanha por conversas informais.',
        'Utiliza reuniões, planilhas ou ferramentas.',
        'Utiliza indicadores e revisões periódicas.'
      ])
    },
    {
      id: 'prioridades',
      secao: secoes.execucao,
      pergunta: 'Como a equipe lida com mudanças de prioridades?',
      opcoes: opcoes([
        'As prioridades mudam sem organização.',
        'As mudanças são decididas informalmente.',
        'Avaliamos o impacto antes de mudar as prioridades.',
        'Utilizamos critérios definidos para priorizar e reorganizar tarefas.'
      ])
    },
    {
      id: 'registroDecisoes',
      secao: secoes.execucao,
      pergunta: 'Como as informações e decisões dos projetos são registradas?',
      opcoes: opcoes([
        'Não são registradas.',
        'Ficam principalmente em conversas e mensagens.',
        'São registradas em documentos ou planilhas.',
        'São centralizadas em uma ferramenta acessível à equipe.'
      ])
    },
    {
      id: 'identificacaoAtrasos',
      secao: secoes.execucao,
      pergunta: 'Como a equipe identifica atrasos ou dificuldades?',
      opcoes: opcoes([
        'Geralmente percebemos quando o prazo já foi comprometido.',
        'Identificamos por meio de conversas.',
        'Acompanhamos as tarefas e seus prazos.',
        'Utilizamos indicadores e alertas para antecipar problemas.'
      ])
    },
    {
      id: 'processos',
      secao: secoes.processos,
      pergunta: 'Os processos de trabalho da startup estão documentados?',
      opcoes: opcoes([
        'Não temos processos definidos.',
        'Existem processos, mas são conhecidos informalmente.',
        'Alguns processos estão documentados.',
        'Os principais processos estão documentados e são revisados.'
      ])
    },
    {
      id: 'revisaoResultados',
      secao: secoes.processos,
      pergunta: 'Com que frequência a equipe revisa os resultados dos projetos?',
      opcoes: opcoes([
        'Nunca.',
        'Somente quando surge um problema.',
        'Periodicamente.',
        'Ao final de cada etapa e também durante a execução.'
      ])
    },
    {
      id: 'resultadoDesejado',
      secao: secoes.abertas,
      pergunta: 'Qual é o principal resultado que você gostaria de alcançar ao melhorar a gestão de projetos da sua startup?'
    },
    {
      id: 'problemaRecorrente',
      secao: secoes.abertas,
      pergunta: 'Descreva brevemente um problema recorrente que dificulta o andamento dos projetos na sua equipe.'
    }
  ];

  private readonly authService = inject(AuthService);
  private readonly diagnosticoService = inject(DiagnosticoService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ arrowBackOutline, arrowForwardOutline, checkmarkOutline, compassOutline });
  }

  get questaoAtual(): QuestaoDiagnostico {
    return this.questoes[this.indiceAtual];
  }

  get progressoPercentual(): number {
    return ((this.indiceAtual + 1) / this.totalQuestoes) * 100;
  }

  get respostaAtual(): string {
    return String(this.form.get(this.questaoAtual.id)?.value ?? '');
  }

  async ionViewWillEnter(): Promise<void> {
    try {
      const usuario = await this.authService.restaurarSessao();
      if (!usuario) {
        await this.router.navigate(['/cadastro']);
        return;
      }

      const diagnostico = await this.diagnosticoService.obter();
      if (diagnostico) {
        this.form.patchValue(diagnostico.respostas);
      }
    } catch (error) {
      await this.mostrarToast(this.mensagemErro(error), 'danger');
      await this.router.navigate(['/cadastro']);
    }
  }

  async avancar(): Promise<void> {
    const control = this.form.get(this.questaoAtual.id);
    if (!control || control.invalid || !this.respostaAtual.trim()) {
      control?.markAsTouched();
      await this.mostrarToast('Responda esta pergunta para continuar.', 'warning');
      return;
    }

    if (this.indiceAtual < this.totalQuestoes - 1) {
      this.indiceAtual += 1;
      return;
    }

    await this.salvar();
  }

  voltar(): void {
    if (this.indiceAtual > 0) {
      this.indiceAtual -= 1;
    }
  }

  async salvar(): Promise<void> {
    if (this.salvando) return;

    this.salvando = true;
    try {
      const respostas: RespostasDiagnostico = this.form.getRawValue();
      await this.diagnosticoService.salvar(respostas);
      await this.mostrarToast('Diagnóstico salvo. Agora escolha sua trilha.', 'success');
      await this.router.navigate(['/sua-trilha']);
    } catch (error) {
      await this.mostrarToast(this.mensagemErro(error), 'danger');
    } finally {
      this.salvando = false;
    }
  }

  private mensagemErro(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.message === 'string') return error.error.message;
      if (error.status === 0) return 'Não foi possível conectar à API. Verifique sua conexão.';
    }
    return 'Não foi possível salvar o diagnóstico. Tente novamente.';
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
