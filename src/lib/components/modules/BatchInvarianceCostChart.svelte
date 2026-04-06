<script lang="ts">
	import { simulation } from '$lib/stores/simulation';
</script>

<div class="module-stub" data-module="C">
	<h4 class="module-stub__title">Модуль C — график стоимости</h4>
	<p class="module-stub__desc">
		Здесь будет переключатель cuBLAS vs batch-invariant и оговорка про illustrative данные.
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
