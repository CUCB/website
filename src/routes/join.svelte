<script>
  import Map from "../components/Map.svelte";
  import { makeTitle } from "../view";
</script>

<style>
  h1,
  h2 {
    margin: 0;
  }

  section {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 10px;
  }

  section div {
    flex-basis: 400px;
    flex-grow: 1;
    margin-right: 1em;
  }

  img {
    width: 400px;
    max-width: 100%;
    margin: 5px;
    flex-shrink: 0;
    box-shadow: 0 0 5px var(--form_color);
  }
</style>

<svelte:head>
  <title>{makeTitle('Join us')}</title>
</svelte:head>

<h1>Join CUCB</h1>

<section>
  <div>
    <p>
      You might never have played folk music before, Celtic or otherwise, or you might have grown up with it, but either
      way you'll enjoy the CUCB. We are a very friendly, non-audition, non-commitment band - check out the rest of this
      page, and
      <a href="/faqs/join/">the FAQs we answered for you</a>
      , to learn more about what we do.
    </p>
    <p>
      The style of playing is more informal than some other genres (like orchestral music), and we have workshops
      throughout the year where you can learn about playing traditional music.
    </p>
    <p>
      Naturally, a lot of our members play instruments typical of folk music, such as fiddle (violin), flute and guitar,
      but the band is certainly not limited to these, and almost anything is welcome - feel free to ask. (We have
      saxophones, cellos, trombones, recorders, accordions, banjos, and much much more - even a wind synthesiser!)
    </p>
  </div>
  <img src="/static/images/join/cbc.jpg" alt="Some people dancing in a church in front of the band" />
  <p>
    We rehearse every Thursday of term-time from 8pm to 10pm, currently in the
    <b>University Social Club (Upstairs Main Hall)</b>
    . We are anticipating being able to continue rehearsals in Michaelmas 2020 that comply with social distancing
    guidelines. Please check any e-mails from the
    <a href="/mailinglists">official list</a>
    before turning up in case of a change of venue.
  </p>
  <Map
    title="Map showing location of the University Social Club"
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d514.0610247491702!2d0.11630405824783323!3d52.20159347864946!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d870a3328d9a8f%3A0xf2286283e2e1415f!2sUniversity%20Social%20Club!5e0!3m2!1sen!2suk!4v1597540877576!5m2!1sen!2suk"
  />
</section>

<h2>Gigs</h2>

<section>
  <div>
    <p>
      We play for ceilidhs [kay-lees] throughout the year. These are fun social dances to traditional Scottish and Irish
      folk tunes. We provide the music and a caller to instruct the dancers, and the crowd goes wild.
    </p>
    <p>
      Our gigs cover a variety of occasions such as: student ceilidhs, birthday parties, weddings and charity events.
      All the money earned goes in a big pot, and is spent on social events and our annual tour.
    </p>
    <p>
      In each gig we have a line-up of up to ten people - you can volunteer to play in as many or as few as you want.
      It's easy and fun to play at a gig, so don't be afraid to sign up.
    </p>
  </div>

  <img src="/static/images/join/claremb.jpg" alt="People in black tie doing ceilidh dancing" />
</section>

<h2>Socials</h2>

<section>
  <div>
    <p>
      We get up to a lot more than just playing music in the Ceilidh Band. Each rehearsal is followed by an informal pub
      trip. Some people carry on the tunes with a
      <a href="/session/">session</a>
      , whilst others just like to have a drink and a chat.
    </p>
    <p>We have several socials each term, all of which are either free or subsidised by the band, including:</p>
    <ul>
      <li>Freshers' Formal</li>
      <li>Band dinners</li>
      <li>Ceilidh Band Sports Day</li>
      <li>Pub trips</li>
      <li>Ceilidh Band Ceilidhs, where we take turns to play and dance</li>
      <li>Black-tie Annual Dinner</li>
      <li>May Week Garden Party</li>
    </ul>
  </div>

  <img src="/static/images/join/annual_dinner_2020.jpg" alt="People in formal dress after annual dinner" />
</section>

<p>
  Some of our money gets spent on our Annual Tour every September. Recent destinations include: Callander, the Lake
  District, and the Peak District.
</p>
<p>
  If you are interested, feel free to join our
  <a href="/mailinglists/">mailing list</a>
  or
  <a href="/committee/">contact a member of the committee</a>
  . We look forward to seeing you at a rehearsal sometime soon.
</p>
