<script lang="ts">
	import { simulation } from '$lib/stores/simulation';
</script>

<div class="module-stub" data-module="A">
	<h4 class="module-stub__title">Модуль A — песочница float</h4>
	<p class="module-stub__desc">
		Здесь будет дерево сложения и сравнение «истинной» суммы с пошаговым float.
	</p>
	<dl class="module-stub__state">
		<div class="module-stub__row">
			<dt>batchSize</dt>
			<dd>{$simulation.batchSize}</dd>
		</div>
		<div class="module-stub__row">
			<dt>precisionMode</dt>
			<dd>{$simulation.precisionMode}</dd>
		</div>
		<div class="module-stub__row">
			<dt>isBatchInvariant</dt>
			<dd>{$simulation.isBatchInvariant}</dd>
		</div>
	</dl>
</div>
