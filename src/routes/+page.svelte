<script lang="ts">
	import ArticleSection from '$lib/components/ArticleSection.svelte';
	import Citation from '$lib/components/Citation.svelte';
	import EquationBlock from '$lib/components/EquationBlock.svelte';
	import MarginalNote from '$lib/components/MarginalNote.svelte';
	import { CITATION_ORDER, getCitation } from '$lib/content';
</script>

<svelte:head>
	<title>The Determinism Gap</title>
	<meta
		name="description"
		content="Интерактивная статья о недетерминизме LLM при temp=0 и batch invariance на уровне редукций."
	/>
</svelte:head>

<header class="site-header">
	<div class="site-header__inner">
		<h1 class="site-title">The Determinism Gap</h1>
		<p class="site-subtitle">
			Черновик каркаса статьи: типографика, марджиналии и место под интерактивы.
		</p>
	</div>
</header>

<main class="article">
	<h2 class="article__title">Почему вывод LLM «плавает» даже при temperature = 0</h2>
	<p class="article__dek">
		Эта статья будет строиться вокруг трёх идей: ассоциативность сложения в float, распределение работы по GPU и
		фиксированное дерево редукций как цена детерминизма. Опорные материалы: <Citation citeId="defeating_nondeterminism_blog" /> и
		<Citation citeId="batch_invariant_ops" />.
	</p>

	<div class="article__meta">
		Статус: контентные примитивы (Task 1.3). Далее — общий стор симуляций и модуль A.
	</div>

	<ArticleSection sectionId="sec-float" title="1. Плавающая точка — это не «просто числа»">
		{#snippet body()}
			<p>
				В арифметике вещественных чисел сложение ассоциативно. В float — нет: порядок округлений меняет результат.
				Классический пример — сумма трёх чисел, где одно из них «слишком мало», чтобы пережить округление рядом с
				огромным соседом.
			</p>
			<EquationBlock tex={'(a + b) + c \\neq a + (b + c)'} />
			<p>
				Дальше мы сделаем песочницу, где можно перетаскивать слагаемые по дереву сложения и видеть, где именно
				теряется единица.
			</p>
		{/snippet}
		{#snippet marginal()}
			<MarginalNote
				id="note-nonassoc"
				title="Ключевая интуиция"
				content={'Float — это конечная точность. Округление после каждой операции превращает «алгебру» в последовательность приближений.'}
			/>
		{/snippet}
	</ArticleSection>

	<ArticleSection sectionId="sec-gpu" title="2. GPU: один запрос может быть «разрезан» между SM">
		{#snippet body()}
			<p>
				При маленьком batch одна матричная операция может быть разбита так, что несколько streaming multiprocessors
				вкладывают частичные суммы в общий аккумулятор. Если порядок вкладов не фиксирован, итог может чуть меняться
				из-за порядка округлений — даже если «логика модели» формально одна и та же.
			</p>
			<p>
				При большом batch чаще получается более «прямолинейное» распределение: меньше совместных редукций, меньше
				гонок за порядком суммирования.
			</p>
		{/snippet}
		{#snippet marginal()}
			<MarginalNote
				id="note-atomic-story"
				title="Упрощённая модель"
				content={'Здесь мы намеренно рисуем мультфильм: реальные ядра сложнее. Цель — показать, где рождается зависимость результата от порядка редукции.'}
			/>
		{/snippet}
	</ArticleSection>

	<ArticleSection
		sectionId="sec-invariance"
		title="3. Batch Invariance: плата за битово-согласованную редукцию"
	>
		{#snippet body()}
			<p>
				Идея batch invariance — заставить редукцию следовать фиксированному дереву независимо от batch size. Это
				может снизить пиковую производительность, но выкупает предсказуемость: одинаковые входы и одинаковые настройки
				должны давать одинаковый результат.
			</p>
			<EquationBlock
				tex={'\\text{trade-off: peak FLOPS} \\rightarrow \\text{bitwise consistency}'}
				caption="Схематично: обмен пиковой скорости на фиксированный порядок редукции."
			/>
			<p>
				Ниже по дорожной карте появится график «стоимости» и proof-блок в духе тестов из
				<Citation citeId="batch_invariant_ops" />.
			</p>
		{/snippet}
		{#snippet marginal()}
			<MarginalNote
				id="note-dod"
				title="Критерий готовности"
				content={'Интерактивы должны быть связаны одним стором: batchSize, precisionMode, isBatchInvariant. Любое изменение мгновенно обновляет все модули.'}
			/>
		{/snippet}
	</ArticleSection>

	<section class="article-section article-section--references" aria-labelledby="sec-refs">
		<h3 class="article-section__title" id="sec-refs">Источники</h3>
		<ol class="references-list">
			{#each CITATION_ORDER as citeKey (citeKey)}
				{@const record = getCitation(citeKey)}
				<li class="references-list__item">
					<a
						class="references-list__link"
						href={record.href}
						rel="noopener noreferrer"
						target="_blank"
					>
						{record.title}
					</a>
					<span class="references-list__sep"> — </span>
					<span class="references-list__url">{record.href}</span>
				</li>
			{/each}
		</ol>
	</section>
</main>

<style>
	.article-section--references {
		margin-top: 48px;
		padding-top: 24px;
		border-top: 1px solid var(--hairline);
	}

	.references-list {
		margin: 0;
		padding-left: 1.25rem;
		max-width: var(--max-text);
		font-size: 15px;
		line-height: 1.55;
		color: var(--muted);
		font-family:
			ui-sans-serif,
			system-ui,
			-apple-system,
			Segoe UI,
			Roboto,
			Helvetica,
			Arial,
			'Apple Color Emoji',
			'Segoe UI Emoji';
	}

	.references-list__item {
		margin-bottom: 10px;
	}

	.references-list__item:last-child {
		margin-bottom: 0;
	}

	.references-list__link {
		color: var(--accent);
		font-weight: 600;
	}

	.references-list__url {
		word-break: break-all;
		font-size: 13px;
	}

	.references-list__sep {
		color: var(--muted);
	}
</style>
