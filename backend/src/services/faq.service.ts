import { Op } from 'sequelize';
import { FaqItem, FaqTheme } from '../models';
import { faqLinkLabel } from '../utils/faq-pages';

export interface PublicFaqQuestion {
  id: string;
  question: string;
  answer: string;
  link: { to: string; label: string } | null;
}

export interface PublicFaqTheme {
  id: string;
  name: string;
  items: PublicFaqQuestion[];
}

// A theme that is down, or has no question on air, does not reach the page; its questions stay stored (design 18d).
export async function listPublicFaq(): Promise<PublicFaqTheme[]> {
  const themes = await FaqTheme.findAll({ where: { published: true }, order: [['sortOrder', 'ASC']] });
  if (themes.length === 0) return [];
  const items = await FaqItem.findAll({
    where: { published: true, themeId: { [Op.in]: themes.map((theme) => theme.id) } },
    order: [['sortOrder', 'ASC'], ['id', 'ASC']],
  });
  return themes
    .map((theme) => ({
      id: theme.id,
      name: theme.name,
      items: items
        .filter((item) => item.themeId === theme.id)
        .map((item) => {
          const label = faqLinkLabel(item.linkTo);
          return { id: item.id, question: item.question, answer: item.answer, link: item.linkTo && label ? { to: item.linkTo, label } : null };
        }),
    }))
    .filter((theme) => theme.items.length > 0);
}
