import { Injectable } from '@nestjs/common';

@Injectable()
export class IngredientsService {
  analyze(raw: string) {
    const list = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Very dumb fake response for now
    return {
      input: raw,
      parsed: list,
      summary: 'Demo summary – real analyzer coming soon.',
      actives: list.slice(0, 2),
      tags: ['Demo', 'Hydrating?'],
    };
  }
}

