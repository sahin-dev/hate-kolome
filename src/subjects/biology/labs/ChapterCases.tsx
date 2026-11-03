import { CaseRunner } from './CaseLab';
import { SET_A } from './cases/setA';
import { SET_B } from './cases/setB';
import { SET_C } from './cases/setC';

const all = { ...SET_A, ...SET_B, ...SET_C };

/** One lab component for each chapter's creative-question practice. */
export const casesFor = (chapter: number) => () => <CaseRunner cases={all[chapter]} />;
