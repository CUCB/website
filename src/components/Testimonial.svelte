<script>
export let person;
</script>

<style>
    div {
        border-style: solid;
        border-width: 2px;
        border-color: var(--accent); 
        padding: 5px;
    }


    #text {

        font-weight: 700;
    }

    #person {
        text-align: right;
        font-style: italic;
    }

</style>


<div class="testimonial">
<p id="text"><slot></slot></p>
<p id="person">{person}</p>
</div>
