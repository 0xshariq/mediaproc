import { ExplainContext } from '../../types/explainTypes.js';
import chalk from 'chalk';
import boxen from 'boxen';
import { explainSentences } from '../phrases/explainSentences.js';

const SECTION_STYLES: Record<string, (txt: string) => string> = {
  'SUMMARY': txt => chalk.bold.bgCyan.black(` ${txt} `),
  'WHAT WILL HAPPEN': txt => chalk.bold.bgGreen.black(` ${txt} `),
  'OUTPUTS': txt => chalk.bold.bgMagenta.black(` ${txt} `),
  'FLAGS': txt => chalk.bold.bgYellow.black(` ${txt} `),
  'WHAT WILL NOT HAPPEN': txt => chalk.bold.bgRed.white(` ${txt} `),
  'PROCESSING FLOW': txt => chalk.bold.bgWhite.black(` ${txt} `),
  'OUTCOME': txt => chalk.bold.bgRedBright.white(` ${txt} `),
  'TECHNICAL DETAILS': txt => chalk.bold.bgGray.white(` ${txt} `),
};

export function explainDetailsTemplate(context: ExplainContext): string {
  const lines: string[] = [];
  const sentences: string[] = [];

  // Details mode: plugin-agnostic, detailed, relevant sentences only
  if (explainSentences.summaryHeader) sentences.push(explainSentences.summaryHeader());
  if (explainSentences.inputRead) sentences.push(explainSentences.inputRead(context));
  if (explainSentences.whatWillHappenHeader) sentences.push(explainSentences.whatWillHappenHeader());
  if (explainSentences.outputWrite) sentences.push(explainSentences.outputWrite(context));
  if (explainSentences.flagsUsedHeader) sentences.push(explainSentences.flagsUsedHeader());
  if (explainSentences.whatWillNotHappenHeader) sentences.push(explainSentences.whatWillNotHappenHeader());
  // Group the original plugin-agnostic phrases for this section
  const notHappen = [
    explainSentences.noNetwork(),
    explainSentences.noBackgroundTasks(),
    explainSentences.noOriginalModification(),
    explainSentences.dataLocalOnly()
  ].join(' ');
  sentences.push(notHappen);
  if (explainSentences.technicalDetailsHeader) sentences.push(explainSentences.technicalDetailsHeader());
  if (explainSentences.summarySuccess) sentences.push(explainSentences.summarySuccess());

  for (const sentence of sentences) {
    if (typeof sentence === 'string') {
      // Detect section headers (e.g., 'SUMMARY:', 'WHAT WILL HAPPEN:', 'WHAT WILL NOT HAPPEN:')
      const match = sentence.match(/^(SUMMARY|WHAT WILL HAPPEN|WHAT WILL NOT HAPPEN|OUTPUTS|FLAGS|SAFETY|PROCESSING FLOW|OUTCOME|TECHNICAL DETAILS):\s*(.*)$/);
      if (match) {
        const [, section, rest] = match;
        lines.push(SECTION_STYLES[section] ? SECTION_STYLES[section](section) : section);
        if (rest && rest.trim()) lines.push(rest.trim());
      } else {
        lines.push(sentence);
      }
    }
  }

  return boxen(lines.join('\n'), {
    padding: 1,
    borderColor: 'gray',
    borderStyle: 'round',
    backgroundColor: 'black',
  });
}