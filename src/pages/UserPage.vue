<template>
    <feed-container :key="currentParameter">
        <section v-if="ownProfile()" class="section_title">
            My profile
        </section>
        <section v-else class="section_title">
            {{ profileUsername }}'s profile
        </section>
        <section :class="profileBoxClass" v-if="userPicture">
            <profile-picture
                v-if="userPicture"
                :picture="userPicture">
            </profile-picture>
            <div class="statsblock">
                <div class="topblock">
                    <div class="name-color">
                        <!--
                        <div class="color-scheme"></div>
                        -->
                        <div class="username">@{{ profileUsername }}</div>
                    </div>
                    <button 
                        v-if="!ownProfile() && isLoggedIn" 
                        class="followbutton"
                        :class="{ following: isFollowing, disabled: isFollowButtonDisabled }" 
                        @click="followAction"
                        :disabled="isFollowButtonDisabled">
                        {{ isFollowing ? 'Unfollow' : 'Follow' }}
                    </button>
                </div>
                <div class="stats-container">
                    <div class="stats">
                        <div class="count-block">
                            <b>Stories</b>
                            <div class="count-block__num">{{ nStories }}</div>
                        </div>
                        <div class="count-block">
                            <b>Followers</b>
                            <div class="count-block__num">{{ nFollowers }}</div>
                        </div>
                        <div class="count-block">
                            <b>Following</b>
                            <div class="count-block__num">{{ nFollowing }}</div>
                        </div>
                    </div>
                </div>
                <div class="separator">
                    <div class="stats-bio">
                        <b>Bio</b>
                        <div class="bio-content">{{ userBio }}</div>
                    </div>
                    <div v-if="ownProfile() && isLoggedIn" class="miscbuttons">
                        <button class="settingsbutton" @click="goToSettings">User settings</button>
                        <button class="logoutbutton" @click="logout()">Log out</button>
                    </div>
                </div>
            </div>
        </section>
        <section class="profile-box centered" v-else>
            <div v-if="loading" class="loader-container">
            <div class="lds-facebook">
                <div></div>
                <div></div>
                <div></div>
            </div>
            <span class="loader-text">Spotting authors nearby...</span>
        </div>
        </section>

        <section v-if="ownProfile()" class="section_title">
            My posts
        </section>
        <section v-else class="section_title">
            {{ profileUsername }}'s posts
        </section>
        <div v-if="loading" class="loader-container">
            <div class="lds-facebook">
                <div></div>
                <div></div>
                <div></div>
            </div>
            <span class="loader-text">Harvesting user stories...</span>
        </div>
        <div v-else-if="posts.length > 0">
            <div v-for="post in posts" :key="post._id.$oid">
                <template v-if="post.type === 'prologue'">
                    <post-container
                        :_id="post._id"
                        :title="post.title"
                        :content="post.content"
                        :username="post.username"
                        :postComment="post.comment"
                        :date="post.date"
                        :picture="post.picture"
                        :color="post.color"
                        :feedMode="true">
                    </post-container>
                </template>
                <template v-else>
                    <continuestoryfeed-container
                        :_id="post._id"
                        :storyId="post.story_id"
                        :parentChapterId="post.parent_chapter_id"
                        :content="post.content"
                        :chapterName="post.chapter_name"
                        :chapterNum="post.chapter_num"
                        :username="post.username"
                        :color="post.color"
                        :storyTitle="post.story_title"
                        :postComment="post.comment"
                        :date="post.date"
                        :picture="post.picture"
                        :tags="post.tags">
                    </continuestoryfeed-container>
                </template>
                </div>
            </div>
            <div v-else>
            <div class="imagecontainer">
                <div class="onomatopoeia">crick crick</div>
                <img class="astronaut-image" src="../assets/img/astronaut_reading_space_nostars.png" alt="astronaut floating">
                <div v-if="ownProfile()" class="loader-text">Countless tales have been told since the beginning of time, yet none have borne your signature. Let's change that!</div>
                <div v-else class="loader-text">Countless tales have been told since the beginning of time, yet none have borne their signature. What might they be doing?</div>
            </div>
        </div>
    </feed-container>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { useRouter } from 'vue-router';
import { API_BASE_URL } from '../config';
import axios from 'axios';

import FeedContainer from "../components/layout/FeedContainer.vue";
import PostContainer from "../components/layout/PostContainer.vue";
import ProfilePicture from '@/components/layout/ProfilePicture.vue';
import ContinuestoryfeedContainer from '@/components/layout/ContinuestoryfeedContainer.vue';

export default {
    setup() {
        const router = useRouter();
        return { router: router };
    },
    data() {
        return {
            posts: [],
            bio: null,
            profileUsername: null,
            loading: true,
            userPicture: "",
            userColor: "",
            userBio: "",
            nStories: 0,
            nFollowers: 0,
            nFollowing: 0,
            isFollowing: null,
            isFollowButtonDisabled: false,
        }
    },
    components: {
        FeedContainer,
        PostContainer,
        ProfilePicture,
        ContinuestoryfeedContainer
    },
    computed: {
        ...mapGetters('auth', ['isLoggedIn', 'currentUser', "userFetchedPicture", "colorFetched", "userFetchedBio", "nFetchedPosts", "nFetchedFollowers", "nFetchedFollowing"]),
        currentParameter() {
            return this.$route.params.id; // Replace "parameter" with the actual name of your URL parameter
        },
        imgSource() {
            return require('../assets/img/' + this.userColor);
        },
        profileBoxClass() {
            return `profile-box ${this.userColor}`;
        },
    },
    mounted() {
        this.fetchDataComponent();
    },
    watch: {
        currentParameter() {
            this.profileUsername = this.$route.params.id;
        },

    },
    methods: {
        ...mapActions('auth', ['logout']),
        ownProfile() {
            if (this.profileUsername === this.currentUser) {
                return true;
            } else {
                return false;
            }
        },
        followAction() {

            this.isFollowButtonDisabled = true;

            const data_packet = {
                action: !this.isFollowing ? "follow" : "unfollow",
                user_being_followed: this.profileUsername,
                user_follows: this.currentUser
            }

            axios
                .post(`${API_BASE_URL}/follow`, data_packet)
                .then(response => {
                    const data = response.data;
                    if (data == "Success") {
                        this.isFollowing = !this.isFollowing
                    }
                    this.isFollowButtonDisabled = false;
                })

                .catch(error => {
                    console.log(error);
                    this.isFollowButtonDisabled = false;
                });
        },
        goToSettings() {
            this.$router.push('/settings');
        },
        fetchDataComponent() {
            this.profileUsername = this.$route.params.id;
            if (this.ownProfile()) {
                this.userPicture = this.userFetchedPicture;
                this.userColor = this.colorFetched;
                this.userBio = this.userFetchedBio;
                this.nStories = this.nFetchedPosts;
                this.nFollowers = this.nFetchedFollowers;
                this.nFollowing = this.nFetchedFollowing;

            axios
                .get(`${API_BASE_URL}/posts/${this.profileUsername}`)
                .then(response => {
                    const data = response.data;
                    console.log(data)
                    this.posts = data;
                    this.loading = false;
                })
                .catch(error => {
                    console.log(error);
                });
            } else {
            axios
                .get(`${API_BASE_URL}/user/${this.profileUsername}`)
                .then(response => {
                    const data = response.data;
                    this.posts = data.posts;
                    const userData = data.user_data;
                    this.userPicture = userData.picture;
                    this.userColor = userData.color;
                    this.userBio = userData.bio; 
                    this.nStories = userData.started_stories + userData.continued_stories;
                    this.nFollowers = userData.followers.length;
                    this.nFollowing = userData.following.length;
                    this.loading = false;

                    if (this.isLoggedIn) {
                        if (userData.followers.includes(this.currentUser)) {
                            this.isFollowing = true;
                        } else {
                            this.isFollowing = false;
                        }
                    }
                })
                .catch(error => {
                    console.log(error);
                });
            }
        }
    }
}

</script>

<style scoped>
.disabled {
  opacity: 0.5; /* or any other visual styling for disabled state */
  pointer-events: none; /* disable pointer events */
  cursor: default; /* set cursor to "not-allowed" */
}

.followbutton.following {
  /* Button styles when following */
  background-color: #ff7b009c;
  color: #fffb00f6;
  text-align: center;
  width: auto;
}

.followbutton.following:hover {
  /* Button styles when following */
  background-color: #ff7b006e;
  color: #fffb00f6;
}

.separator {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
}

.stats-container {
    width: 100%;
    padding: 0 10px;
}

.onomatopoeia {
    color: whitesmoke;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: -10px;
}

@keyframes floatAnimation {
  0% {
    transform: translateY(-5px);
  }
  50% {
    transform: translateY(5px);
  }
  100% {
    transform: translateY(-5px);
  }
}

.astronaut-image {
    width: 175px;
    height: auto;
    animation: floatAnimation 4s ease-in-out infinite;
}

.imagecontainer {
    margin: 50px auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: fit-content;
}

.loader-text {
    background-color: whitesmoke;
    text-align: center;
    color: rgb(0, 0, 0);
    padding: 5px 10px;
    border-radius: 15px;
    font-weight: bold;
    margin: 0 10px;
}

.centered {
    justify-content: center;
    align-items: center;
    height: 300px
}

.loader-text {
    background-color: whitesmoke;
    color: rgb(0, 0, 0);
    padding: 5px 10px;
    border-radius: 15px;
    font-weight: bold;
}

.loader-container {
    margin: 40px 0 0 0;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
}

.lds-facebook {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-facebook div {
  display: inline-block;
  position: absolute;
  left: 8px;
  width: 16px;
  background: #fff;
  animation: lds-facebook 1.2s cubic-bezier(0, 0.5, 0.5, 1) infinite;
}
.lds-facebook div:nth-child(1) {
  left: 8px;
  animation-delay: -0.24s;
}
.lds-facebook div:nth-child(2) {
  left: 32px;
  animation-delay: -0.12s;
}
.lds-facebook div:nth-child(3) {
  left: 56px;
  animation-delay: 0;
}
@keyframes lds-facebook {
  0% {
    top: 8px;
    height: 64px;
  }
  50%, 100% {
    top: 24px;
    height: 32px;
  }
}

.name-color {
    display: flex;
}

.color-scheme {
    border-radius: 500%;
    background-color: rgb(0, 183, 255);
    width: 25px;
    height: 25px;
    align-self: center;
    margin: 0 15px 0 0;
    box-shadow: 0px 0px 10px 2px rgba(0, 183, 255, 0.575);
}

.followbutton {
    height: 30px;
    font-family: inherit;
    border: 0px solid #e5e3ff;
    color: rgb(0, 255, 98);
    cursor: pointer;
    font-size: 15px;
    width: 80px;
    margin: 10px 10px 10px 0;
    background-color: #59ff9138;
    border-radius: 4px;
    transition: all 0.1s;
}

.followbutton:hover {
    background-color: #41bb6a2f;
}

.miscbuttons {
    display: flex;
    flex-direction: row;
    margin: 10px 0 5px 0;
    height: 30px;
    align-items: center;
    justify-content: flex-end;
    width: 80%;
    align-self: end;
}

.logoutbutton {
    height: 30px;
    font-family: inherit;
    border: 0px solid #e5e3ff;
    color: rgb(255, 255, 255);
    cursor: pointer;
    font-size: 15px;
    width: 85px;
    margin: 10px 10px 10px 20px;
    background-color: #ff0000cc;
    border-radius: 4px;
    align-items: center;
    transition: all 0.1s;
}

.logoutbutton:hover {
    background-color: #ff00006c;
}

.settingsbutton {
    height: 30px;
    font-family: inherit;
    border: none;
    color: rgb(255, 255, 255);
    cursor: pointer;
    font-size: 15px;
    width: 140px;
    margin: 10px 10px 10px 0;
    background-color: rgba(0, 0, 0, 0.459);
    border-radius: 4px;
    align-items: center;
    transition: all 0.1s;
}

.settingsbutton:hover {
    background-color: rgba(0, 0, 0, 0.185);
}

.section_title {
  padding-bottom: 2px;
  margin: 35px 10px 20px 10px;
  font-size: larger;
  font-weight: bold;
  color: rgb(0, 248, 174);
  border-bottom: 2px solid rgb(180, 255, 233);
}

.profile-box {
    display: flex;
    flex-direction: row;
    background-color: rgb(119 119 119 / 19%);
    padding: 10px;
    border-radius: 10px;
}

.profile-box.salmon {
    border: 4px rgb(255, 109, 93) solid;
    box-shadow: 0px 0px 5px 2px rgb(255, 109, 93);
}

.profile-box.red {
    border: 4px rgb(255, 25, 0) solid;
    box-shadow: 0px 0px 5px 2px rgb(255, 25, 0);
}

.profile-box.blue {
    border: 4px rgb(0, 153, 255) solid;
    box-shadow: 0px 0px 5px 2px rgb(0, 153, 255);
}

.profile-box.green {
    border: 4px rgb(55, 182, 97) solid;
    box-shadow: 0px 0px 5px 2px rgb(55, 182, 97);
}

.profile-box.yellow {
    border: 4px rgb(255, 217, 0) solid;
    box-shadow: 0px 0px 5px 2px rgb(255, 217, 0);
}

.profile-box.white {
    border: 4px rgb(255, 255, 255) solid;
    box-shadow: 0px 0px 5px 2px rgb(255, 255, 255);
}

.profile-box.purple {
    border: 4px rgb(183, 0, 255) solid;
    box-shadow: 0px 0px 5px 2px rgb(183, 0, 255);
}

.profile-box.pink {
    border: 4px rgb(255, 0, 179) solid;
    box-shadow: 0px 0px 5px 2px rgb(255, 0, 179);
}

.profile-box.orange {
    border: 4px rgb(255, 145, 0) solid;
    box-shadow: 0px 0px 5px 2px rgb(255, 145, 0);
}

.topblock {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-evenly;
    align-items: center;
    margin: 25px 0 0 0;
}


.statsblock {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: fit-content;
    width: 340px;
    height: auto;
}

.username {
    color: whitesmoke;
    font-weight: bold;
    font-size: x-large;
}

.stats {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin: 20px 0 0 0;
    width: 100%;
    color: whitesmoke;
    transition: all 0.1s;
}

.count-block {
    display: flex;
    flex-direction: column;
    background-color: rgba(151, 151, 151, 0.192);
    padding: 5px;
    border-radius: 8px;
    cursor: pointer;
}

.count-block:hover {
    background-color: rgba(192, 192, 192, 0.192);
}

.stats-bio {
    background-color: rgb(255, 255, 255);
    border-radius: 10px 10px 10px 10px;
    padding: 10px;
    margin: 20px 10px 15px 10px;
    color: rgb(0, 0, 0);
}

@media screen and (max-width: 700px) {
    .profile-box {
        flex-direction: column;
        width: fit-content;
        margin: auto;
    }

    .topblock {
        margin: 0px 0 0 0;
    }

    .statsblock {
        height: fit-content;
        margin: 15px 0 0 0;
    }
}

</style>