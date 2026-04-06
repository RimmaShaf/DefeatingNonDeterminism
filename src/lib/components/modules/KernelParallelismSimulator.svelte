<script lang="ts">
	import { simulation } from '$lib/stores/simulation';
</script>

<div class="module-stub" data-module="B">
	<h4 class="module-stub__title">Модуль B — сетка GPU и batch</h4>
	<p class="module-stub__desc">
		Здесь будет визуализация Split-K vs data parallel и «метр» недетерминизма.
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
