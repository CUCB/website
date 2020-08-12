<script context="module">
  import Testimonial from "../components/Testimonial.svelte";
  import { makeTitle } from "../view.js";
  import BookingForm from "../components/BookingForm.svelte";
</script>

<script>
  let bookingFormComplete = false;
</script>

<svelte:head>
  <title>{makeTitle('Book us')}</title>
</svelte:head>

<h1>Book CUCB</h1>
<h2>Perfect for May Balls, birthday parties, student events and weddings</h2>

<p>
  The Cambridge University Ceilidh Band warmly welcomes all enquiries. We are available for hire all year round, and
  have experience playing at a wide variety of events. If you're ready to book us, get in touch using the contact form
  below!
</p>
<p>
  We predominantly take bookings within the Cambridgeshire area as we are based in the centre of Cambridge, but have
  been known to travel further afield. The Ceilidh Band is able to supply everything needed for a ceilidh: we bring
  along a large band, our own amplification equipment, and an experienced caller to instruct the dancers so that
  everyone can join in.
</p>
<p>
  If this all sounds interesting, plenty more information is available via the
  <a href="/faqs/book/">Frequently Asked Questions</a>
  page and the
  <a href="/docs/standard-gig-policy.pdf" target="_blank">Standard Gig Policy</a>
  &mdash; and of course by contacting us!
</p>
<Testimonial person="Fiammetta, Birthday Celebration, January 2019">
  I just wanted to express my thanks for the music and dance instruction at my ceilidh yesterday! A particular thanks to
  the caller, who was so lovely and enthusiastic, really creating a welcoming atmosphere! (Even those of my friends who
  are the least inclined to dancing had a go!) I had so much fun, and will definitely recommend you to all my friends!
</Testimonial>
<Testimonial person="Clare, Wedding Anniversary, October 2018">
  Thank you so much for making our 15th wedding anniversary ceilidh so brilliant! You were all fabulous!
</Testimonial>
<br />
<h2>Contact us</h2>
{#if !bookingFormComplete}
  <p>
    <i>Note:</i>
    For a quote, it would be useful for you to mention the location and purpose of the ceilidh (e.g. wedding, ball,
    fundraiser...). However, do get in touch even if you're not sure of any details yet, and just want to find out a bit
    more about who we are and what we do.
  </p>

  <p>
    If you're interesting in booking us, please also look at our
    <a href="/docs/standard-gig-policy.pdf" target="_blank">Standard Gig Policy</a>
    and also the
    <a href="/faqs/book">Frequently Asked Questions</a>
    !
  </p>
{/if}
<!-- TODO should we put a pic in here -->
<BookingForm on:complete="{() => (bookingFormComplete = true)}" />
